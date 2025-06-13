"use client";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Rocket, Satellite, Info, Loader2, Search, AlertTriangle, Binary, Globe, ExternalLink, LocateFixed, ChevronLeft, ChevronRight, Eye, Radio, MapPinned } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { getTLE, getSatellitePositions, getVisualPasses, getRadioPasses, type SatellitePositionParams, type VisualPassesParams, type RadioPassesParams } from '@/services/n2yoApi';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, isValid, parseISO } from 'date-fns';

declare global {
  interface Window {
    currentUserLocation?: { latitude: number; longitude: number; city?: string; altitude?: number };
  }
}

interface TLEData {
  NORAD_CAT_ID: number;
  tle: string;
  info?: { satname: string };
  [key:string]: any;
}

interface Position {
  satlatitude: number;
  satlongitude: number;
  sataltitude: number;
  azimuth?: number;
  elevation?: number;
  ra?: number;
  dec?: number;
  timestamp: number;
}

interface Pass {
  satid?: number;
  satname?: string;
  startAz: number;
  startAzCompass: string;
  startEl?: number | undefined;
  startUTC: number;
  maxAz: number;
  maxAzCompass: string;
  maxEl?: number | undefined;
  maxUTC: number;
  endAz: number;
  endAzCompass: string;
  endEl?: number | undefined;
  endUTC: number;
  mag?: number | undefined;
  duration: number;
}

interface SatcatData {
  INTLDES?: string;
  NORAD_CAT_ID?: string;
  SATNAME?: string;
  LAUNCH?: string;
  DECAY?: string;
}

export default function SpacecraftTrackingPage() {
  const [noradIdToFetch, setNoradIdToFetch] = useState<string>("25544"); // Default to ISS
  const [searchInput, setSearchInput] = useState<string>("25544"); // Default search input to ISS NORAD ID

  const [tleData, setTleData] = useState<TLEData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [visualPasses, setVisualPasses] = useState<Pass[]>([]);
  const [radioPasses, setRadioPasses] = useState<Pass[]>([]);
  const [satcatData, setSatcatData] = useState<SatcatData | null>(null); // New state for SATCAT data

  const [currentVisualPassIndex, setCurrentVisualPassIndex] = useState(0);
  const [currentRadioPassIndex, setCurrentRadioPassIndex] = useState(0);

  const [loading, setLoading] = useState({
    tle: false, positions: false, visual: false, radio: false, all: false, satcat: false
  });
  const [error, setError] = useState<string | null>(null);
  const [celestrakSatcatError, setCelestrakSatcatError] = useState<string | null>(null); // State for Celestrak SATCAT specific error
  const { toast } = useToast();
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number, alt: number} | null>(null);
  const [locationAttempted, setLocationAttempted] = useState(false);

  const attemptFetchingLocation = () => {
    setLocationAttempted(true);
    if (typeof window !== 'undefined' && window.currentUserLocation) {
      setUserCoords({
        lat: window.currentUserLocation.latitude,
        lng: window.currentUserLocation.longitude,
        alt: window.currentUserLocation.altitude || 0,
      });
      setError(null); 
      return;
    }
    if (!navigator.geolocation) {
      setError(prev => prev ? `${prev} Geolocation not supported.` : 'Geolocation not supported. Pass predictions require location.');
      toast({ title: "Location Error", description: "Geolocation not supported by your browser.", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          alt: position.coords.altitude || 0,
        };
        setUserCoords(newCoords);
        setError(null);
        if (typeof window !== 'undefined') {
          window.currentUserLocation = { latitude: newCoords.lat, longitude: newCoords.lng, altitude: newCoords.alt, city: "Fetched Locally" };
        }
        toast({ title: "Location Acquired", description: "Using your current location for pass predictions.", variant: "default" });
      },
      () => {
        setError(prev => prev ? `${prev} Location permission denied.` : 'Location permission denied. Pass predictions require location.');
        toast({ title: "Location Error", description: "Location permission denied. Pass predictions will be limited.", variant: "destructive" });
      }
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.currentUserLocation) {
        setUserCoords({
            lat: window.currentUserLocation.latitude,
            lng: window.currentUserLocation.longitude,
            alt: window.currentUserLocation.altitude || 0,
        });
    } else {
        attemptFetchingLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCelestrakSatcat = async (noradId: string) => {
    setLoading(prev => ({ ...prev, satcat: true }));
    setCelestrakSatcatError(null);
    
    try {
      // Try to get the TLE data directly from Celestrak
      const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=json`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch satellite data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const satInfo = data[0];
        setSatcatData({
          NORAD_CAT_ID: noradId,
          SATNAME: satInfo.OBJECT_NAME || `Satellite ${noradId}`,
          LAUNCH: satInfo.EPOCH ? new Date(satInfo.EPOCH).toISOString().split('T')[0] : undefined,
        });
      } else {
        throw new Error('No satellite data found in the response');
      }
      
    } catch (e: any) {
      console.error("Celestrak API Error:", e);
      setCelestrakSatcatError(`Failed to load satellite data: ${e.message || 'Unknown error'}`);
      setSatcatData(null);
    } finally {
      setLoading(prev => ({ ...prev, satcat: false }));
    }
  };

  const fetchAllSpacecraftData = async (currentNoradIdStr: string) => {
    const currentNoradIdNum = parseInt(currentNoradIdStr, 10);
    if (isNaN(currentNoradIdNum)) {
      // This case should theoretically not be reached if input is validated before calling this.
      setError("Invalid NORAD ID. Please provide a numeric ID.");
      toast({ title: "Invalid Input", description: "Please enter a valid numeric NORAD ID.", variant: "destructive" });
      setLoading({ tle: false, positions: false, visual: false, radio: false, all: false, satcat: false });
      return;
    }

    setError(null);
    setTleData(null);
    setPositions([]);
    setVisualPasses([]);
    setRadioPasses([]);
    setCurrentVisualPassIndex(0);
    setCurrentRadioPassIndex(0);
    setLoading({ tle: true, positions: true, visual: !!userCoords, radio: !!userCoords, all: true, satcat: true });

    let localErrorMessages: string[] = [];
    const promises = [];

    promises.push(
      getTLE(currentNoradIdNum)
        .then(tle => { setTleData(tle); })
        .catch(e => { console.error("TLE Fetch Error:", e); localErrorMessages.push(`TLE: ${e.message || 'Failed'}`); })
        .finally(() => setLoading(prev => ({ ...prev, tle: false })))
    );

    // Fetch Celestrak SATCAT data in parallel
    promises.push(fetchCelestrakSatcat(currentNoradIdStr)); // Call the new fetch function

    if (userCoords) {
      promises.push(
        getSatellitePositions(currentNoradIdNum, {
          observer_lat: userCoords.lat, observer_lng: userCoords.lng, observer_alt: userCoords.alt, seconds: 1 
        })
        .then(data => setPositions(data.positions || []))
        .catch(e => { console.error("Position Fetch Error:", e); localErrorMessages.push(`Positions: ${e.message || 'Failed'}`); })
        .finally(() => setLoading(prev => ({ ...prev, positions: false })))
      );
      promises.push(
        getVisualPasses(currentNoradIdNum, {
          observer_lat: userCoords.lat, observer_lng: userCoords.lng, observer_alt: userCoords.alt, days: 7, min_visibility: 60
        })
        .then(data => setVisualPasses(data.passes || []))
        .catch(e => { console.error("Visual Pass Fetch Error:", e); localErrorMessages.push(`Visual Passes: ${e.message || 'Failed'}`); })
        .finally(() => setLoading(prev => ({ ...prev, visual: false })))
      );
      promises.push(
        getRadioPasses(currentNoradIdNum, {
          observer_lat: userCoords.lat, observer_lng: userCoords.lng, observer_alt: userCoords.alt, days: 7, min_elevation: 10
        })
        .then(data => setRadioPasses(data.passes || []))
        .catch(e => { console.error("Radio Pass Fetch Error:", e); localErrorMessages.push(`Radio Passes: ${e.message || 'Failed'}`); })
        .finally(() => setLoading(prev => ({ ...prev, radio: false })))
      );
    } else {
       setLoading(prev => ({ ...prev, positions: false, visual: false, radio: false }));
    }
    
    await Promise.all(promises);

    if (!userCoords && locationAttempted) {
      localErrorMessages.push("Pass predictions and current position relative to you require location. Please enable location services.");
    }
    if (localErrorMessages.length > 0) {
      const newErrorMessage = localErrorMessages.join(' | ');
      setError(prevError => prevError ? `${prevError} | ${newErrorMessage}` : newErrorMessage);
    }
    setLoading(prev => ({ ...prev, all: false }));
  };
  
  useEffect(() => {
    if (noradIdToFetch && /^\d+$/.test(noradIdToFetch)) {
      fetchAllSpacecraftData(noradIdToFetch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noradIdToFetch, userCoords]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const inputVal = searchInput.trim();

    if (!inputVal) {
         setError("Please enter a satellite NORAD ID.");
         toast({ title: "Empty Input", description: "Please enter a satellite NORAD ID.", variant: "destructive" });
         return;
    }

    // Check if input is a valid NORAD ID (pure number)
    if (/^\d+$/.test(inputVal)) {
      setNoradIdToFetch(inputVal);
      setError(null);
      toast({ title: "Searching by NORAD ID", description: `Fetching data for NORAD ID: ${inputVal}`, variant: "default" });
      return;
    }

    // If input is not a pure number, show error and guide to AI Chat
    setError("Invalid input. Please enter a numeric NORAD ID. Use the AI Chat Widget to find an ID.");
    toast({ title: "Invalid Input", description: "Please enter a numeric NORAD ID. Use the AI Chat Widget to find an ID.", variant: "destructive" });
  };

  const currentPosition = positions && positions.length > 0 ? positions[0] : null;
  const tleLines = tleData?.tle?.split(/[\r\n]+/).filter(line => line.trim()) || [];

  const safeFormatPassTime = (utcTimestamp: number | undefined) => {
    if (utcTimestamp === undefined) return 'N/A';
    try {
      const date = new Date(utcTimestamp * 1000);
      return isValid(date) ? format(date, 'MMM d, yyyy, p') : 'Invalid Date';
    } catch (e) {
      console.warn("Date formatting failed for pass time:", utcTimestamp, e);
      return 'Invalid Date';
    }
  };

  const handlePassNavigation = (type: 'visual' | 'radio', direction: 'prev' | 'next') => {
    const passes = type === 'visual' ? visualPasses : radioPasses;
    const setCurrentIndex = type === 'visual' ? setCurrentVisualPassIndex : setCurrentRadioPassIndex;
    
    setCurrentIndex(prev => {
      const newIndex = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(newIndex, passes.length > 0 ? passes.length - 1 : 0));
    });
  };

  const renderPassDetails = (pass: Pass | undefined, passType: 'visual' | 'radio') => {
    if (!pass) {
      return <p className="text-base text-muted-foreground flex-grow flex items-center justify-center py-4">No {passType} passes predicted for the next 7 days for your location.</p>;
    }
    return (
      <div className="text-base space-y-1.5 flex-grow p-2">
        <p><strong>Start:</strong> {safeFormatPassTime(pass.startUTC)} ({pass.startAzCompass}, El: {pass.startEl?.toFixed(1) ?? 'N/A'}°)</p>
        <p><strong>Max:</strong> {safeFormatPassTime(pass.maxUTC)} ({pass.maxAzCompass}, El: {pass.maxEl?.toFixed(1) ?? 'N/A'}°{passType === 'visual' && pass.mag !== undefined ? `, Mag: ${pass.mag?.toFixed(1)}` : ''})</p>
        <p><strong>End:</strong> {safeFormatPassTime(pass.endUTC)} ({pass.endAzCompass}, El: {pass.endEl?.toFixed(1) ?? 'N/A'}°)</p>
        <p><strong>Duration:</strong> {pass.duration} seconds</p>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="w-full bg-background/80 backdrop-blur-sm border-b py-6 text-center px-4 sm:px-6 lg:px-8">
        <header>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Rocket className="h-10 w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Live Spacecraft Tracking</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Track spacecraft by NORAD ID.
            {userCoords ? ` Observer: ${userCoords.lat.toFixed(2)}°, ${userCoords.lng.toFixed(2)}°.` :
              locationAttempted ? ' Location needed for pass predictions.' : ' Attempting to get location...'}
          </p>
          {!userCoords && locationAttempted && (
            <Button onClick={attemptFetchingLocation} variant="link" className="text-primary text-sm mt-1">
              <LocateFixed className="mr-2 h-4 w-4"/>Retry Location
            </Button>
          )}
        </header>
      </div>

      {/* Search Form */}
       <div className="px-4 sm:px-6 lg:px-8 py-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-y"> {/* Wrapper div for padding */}
         <p className="text-center text-muted-foreground text-lg mb-4"> {/* Instruction text */}
           To track any spacecraft, enter its NORAD ID below.
            If you don't know the NORAD ID, you can ask the AI Chat Widget.
         </p>
         <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-3"> {/* Removed padding and sticky from form */}
           <div className="flex-grow w-full sm:w-auto">
             <Label htmlFor="searchInputUnified" className="text-base font-medium text-foreground">Spacecraft NORAD ID</Label>
             {/* Input field for NORAD ID */}
             <Input
               id="searchInputUnified"
               type="text"
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               placeholder="Enter Spacecraft NORAD ID (e.g., 25544)"
               className="mt-1 bg-card border-border text-base py-2 shadow-sm"
             />
           </div>
           <Button type="submit" disabled={loading.all} className="w-full sm:w-auto h-10 self-end text-base px-6 py-2 shadow-sm">
             {loading.all ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" /> }
             Track
           </Button>
         </form>
       </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto py-8 px-4 sm:px-6 lg:px-8"> {/* Main content area with padding */}
        {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-md flex items-center justify-center gap-2 text-sm mb-4"><AlertTriangle className="h-5 w-5" />{error}</p>}

        {(loading.tle || loading.all) && !tleData && positions.length === 0 && visualPasses.length === 0 && radioPasses.length === 0 && (
           <div className="flex justify-center my-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-3 text-xl text-muted-foreground">Loading spacecraft data...</span></div>
        )}
        
        {!loading.all && !loading.tle && !tleData && !error && <p className="text-center text-muted-foreground text-lg py-10">Enter a Satellite NORAD ID above to start tracking. Use the AI Chat Widget if you need help finding an ID.</p>}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Grid takes full width within the padded parent */}
          {tleData && (
             <Card className="shadow-md border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Info className="h-6 w-6"/> Satellite Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-base space-y-1.5 min-h-[120px]">
                {loading.tle ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> : tleData ? (
                  <>
                    <p><strong>Name:</strong> {tleData.info?.satname || searchInput || 'N/A'}</p>
                    <p><strong>NORAD ID:</strong> {tleData.NORAD_CAT_ID || noradIdToFetch || 'N/A'}</p>
                     <a href={`https://www.n2yo.com/satellite/?s=${tleData.NORAD_CAT_ID}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1 mt-2">
                          More on N2YO.com <ExternalLink className="h-3.5 w-3.5"/>
                      </a>
                  </>
                ): <p className="text-muted-foreground text-sm">No satellite information available.</p>}
              </CardContent>
            </Card>
          )}

          {tleData && (
            <Card className="shadow-md border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Binary className="h-6 w-6"/>
                  Orbital Elements (TLE)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1"><Info className="h-4 w-4 text-muted-foreground"/></Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm bg-popover border-border text-popover-foreground p-2 rounded-md shadow-lg">
                        <p>Two-Line Element sets (TLEs) are data for determining the orbit of Earth-orbiting satellites. This data is technical and used for precise orbital calculations.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[120px]">
                {loading.tle ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> : tleLines.length > 0 ? (
                    <pre className="text-xs bg-muted/30 p-3 rounded-md overflow-x-auto whitespace-pre font-mono border text-foreground/80">
                      {tleLines.join("\n")}
                    </pre>
                ) : <p className="text-sm text-muted-foreground">No TLE data available.</p>}
              </CardContent>
            </Card>
          )}

          {tleData && userCoords && (
            <Card className="shadow-md border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Globe className="h-6 w-6"/> Current Position
                </CardTitle>
                <CardDescription className="text-sm">Relative to Earth. Azimuth/Elevation shown if observer location is set.</CardDescription>
              </CardHeader>
              <CardContent className="text-base space-y-1.5 min-h-[150px]">
              {loading.positions ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> : currentPosition ? (
                <>
                  <p><strong>Latitude:</strong> {currentPosition.satlatitude?.toFixed(4) ?? 'N/A'}°</p>
                  <p><strong>Longitude:</strong> {currentPosition.satlongitude?.toFixed(4) ?? 'N/A'}°</p>
                  <p><strong>Altitude:</strong> {currentPosition.sataltitude?.toFixed(2) ?? 'N/A'} km</p>
                  {userCoords && typeof currentPosition.azimuth === 'number' && <p><strong>Azimuth (from your location):</strong> {currentPosition.azimuth.toFixed(2)}°</p>}
                  {userCoords && typeof currentPosition.elevation === 'number' && <p><strong>Elevation (from your location):</strong> {currentPosition.elevation.toFixed(2)}°</p>}
                  <p className="text-xs text-muted-foreground pt-1">Timestamp: {format(new Date(currentPosition.timestamp * 1000), 'PPpp')}</p>
                </>
              ) : <p className="text-sm text-muted-foreground">{!userCoords && locationAttempted ? 'Enable location services for precise data.' : 'No current position data available or satellite out of view.'}</p>}
              </CardContent>
            </Card>
          )}
          
          {tleData && userCoords && (
            <>
              <Card className="shadow-md border border-border bg-card flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary"><Eye className="h-6 w-6"/> Visual Passes</CardTitle>
                  <CardDescription className="text-sm">Predicted passes for {tleData?.info?.satname || 'satellite'} over {userCoords.lat.toFixed(2)}°, {userCoords.lng.toFixed(2)}° (next 7 days).</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex flex-col flex-grow">
                  {loading.visual ? <div className="flex justify-center items-center flex-grow"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> : 
                    visualPasses.length > 0 ? renderPassDetails(visualPasses[currentVisualPassIndex], 'visual')
                     : <p className="text-base text-muted-foreground flex-grow flex items-center justify-center py-4">No visual passes predicted for the next 7 days.</p>}
                </CardContent>
                {visualPasses.length > 0 && (
                    <div className="flex justify-between items-center mt-auto p-2 border-t">
                    <Button variant="ghost" size="icon" onClick={() => handlePassNavigation('visual', 'prev')} disabled={currentVisualPassIndex === 0 || visualPasses.length === 0}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Pass {visualPasses.length > 0 ? currentVisualPassIndex + 1 : 0} of {visualPasses.length}</span>
                    <Button variant="ghost" size="icon" onClick={() => handlePassNavigation('visual', 'next')} disabled={currentVisualPassIndex >= visualPasses.length - 1 || visualPasses.length === 0}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    </div>
                )}
              </Card>

              <Card className="shadow-md border border-border bg-card flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary"><Radio className="h-6 w-6"/> Radio Passes</CardTitle>
                  <CardDescription className="text-sm">Predicted passes for {tleData?.info?.satname || 'satellite'} over {userCoords.lat.toFixed(2)}°, {userCoords.lng.toFixed(2)}° (next 7 days).</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex flex-col flex-grow">
                  {loading.radio ? <div className="flex justify-center items-center flex-grow"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> : 
                    radioPasses.length > 0 ? renderPassDetails(radioPasses[currentRadioPassIndex], 'radio')
                    : <p className="text-base text-muted-foreground flex-grow flex items-center justify-center py-4">No radio passes predicted for the next 7 days.</p>}
                </CardContent>
                 {radioPasses.length > 0 && (
                    <div className="flex justify-between items-center mt-auto p-2 border-t">
                    <Button variant="ghost" size="icon" onClick={() => handlePassNavigation('radio', 'prev')} disabled={currentRadioPassIndex === 0 || radioPasses.length === 0}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Pass {radioPasses.length > 0 ? currentRadioPassIndex + 1 : 0} of {radioPasses.length}</span>
                    <Button variant="ghost" size="icon" onClick={() => handlePassNavigation('radio', 'next')} disabled={currentRadioPassIndex >= radioPasses.length - 1 || radioPasses.length === 0}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    </div>
                )}
              </Card>
            </>
          )}

          {/* New Card for Launch and Decay Dates */}
          {satcatData && ( // Only render if satcatData is available
             <Card className="shadow-md border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Info className="h-6 w-6"/> Launch & Decay Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-base space-y-1.5 min-h-[120px]">
                {loading.satcat ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div> : satcatData ? (
                  <>
                    <p><strong>Launch Date:</strong> {satcatData.LAUNCH || 'N/A'}</p>
                    <p><strong>Decay Date:</strong> {satcatData.DECAY || 'N/A'}</p>
                     {/* Note: Launch Site is rarely available from Celestrak SATCAT */}
                  </>
                ): <p className="text-muted-foreground text-sm">No launch or decay date available from Celestrak.</p>}
              </CardContent>
            </Card>
          )}

          {/* New Card for Celestrak SATCAT Errors */}
          {celestrakSatcatError && !satcatData && ( // Only render if there's a Celestrak error and no SATCAT data
             <Card className="shadow-md border border-destructive bg-destructive/10 text-destructive">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6"/> Celestrak Data Error
                </CardTitle>
              </CardHeader>
              <CardContent className="text-base space-y-1.5 min-h-[120px]">
                <p>{celestrakSatcatError}</p>
                <p className="text-sm mt-2">This may occur if the NORAD ID is incorrect or if detailed catalog data is not available from Celestrak for this spacecraft.</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {!userCoords && locationAttempted && tleData && (
            <Card className="lg:col-span-2 mt-6 shadow-md border border-border bg-card/70 p-6 flex flex-col items-center justify-center text-center min-h-[150px]">
            <MapPinned className="h-10 w-10 text-primary mb-3"/>
            <p className="text-lg font-semibold text-foreground mb-2">Location Required for Pass Predictions</p>
            <p className="text-base text-muted-foreground mb-3">Please enable location services in your browser or device to see visual and radio pass predictions for this satellite from your current location.</p>
            <Button onClick={attemptFetchingLocation} variant="default" size="sm">
                <LocateFixed className="mr-2 h-4 w-4"/>Retry Location
            </Button>
            </Card>
        )}

        <p className="text-center text-muted-foreground text-xs italic py-6 mt-6">
          Spacecraft data provided by N2YO.com. Observer location is used for accurate pass predictions and relative current position. TLE data is technical and used for orbital calculations.
        </p>
      </div>
    </div>
  );
}

    