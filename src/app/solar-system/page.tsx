
"use client";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Globe, Telescope, Orbit, Sun as SunIcon, Sparkles, Loader2, AlertTriangle, Moon as MoonIconLucide, Rocket } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fetchAllPlanetsData } from '@/services/nasaHorizonsApi';

declare global {
  interface Window {
    currentUserLocation?: { latitude: number; longitude: number; city?: string; altitude?: number };
  }
}

interface AstroPlanetData {
    id: string;
    name: string;
    distance?: { km?: string; au?: string; };
    hipparcos?: string;
    position?: {
        constellation?: { id: string, name: string };
        horizonal?: { altitude?: { degrees?: string, string?: string }, azimuth?: { degrees?: string, string?: string } };
        equatorial?: { rightAscension?: { hours?: string, string?: string }, declination?: { degrees?: string, string?: string } };
    };
    extraInfo?: {
        magnitude?: string;
        phaseAngle?: string;
        phaseName?: string;
        elongation?: string;
    };
    imageUrl?: string;
}

const majorPlanetsAndSunMoon = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

export default function SolarSystemPage() {
  // State for user's coordinates and data
  interface Coordinates {
    lat: number;
    lng: number;
  }

  interface UserCoords extends Coordinates {
    latitude?: number; // For compatibility with window.currentUserLocation
    longitude?: number; // For compatibility with window.currentUserLocation
  }
  
  // Default to Gaibandha, Bangladesh coordinates if location is not available
  const defaultCoords: Coordinates = { lat: 25.33, lng: 89.53 };
  
  // State management
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [planetaryData, setPlanetaryData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const today = new Date();
  
  // Function to get sample data for all planets
  const getSampleDataForAllPlanets = () => ({
    'Sun': { distanceAu: '1.000', distanceKm: '149,597,870.7', elevation: '45.2°', azimuth: '180.5°' },
    'Moon': { distanceAu: '0.00257', distanceKm: '384,400', elevation: '30.1°', azimuth: '120.3°', phase: 'Waxing Gibbous', illumination: '78%' },
    'Mercury': { distanceAu: '0.61', distanceKm: '91,000,000', elevation: '15.2°', azimuth: '95.7°' },
    'Venus': { distanceAu: '0.72', distanceKm: '108,000,000', elevation: '25.3°', azimuth: '110.4°' },
    'Mars': { distanceAu: '1.38', distanceKm: '206,000,000', elevation: '40.2°', azimuth: '200.8°' },
    'Jupiter': { distanceAu: '4.20', distanceKm: '628,000,000', elevation: '60.5°', azimuth: '220.1°' },
    'Saturn': { distanceAu: '9.58', distanceKm: '1,433,000,000', elevation: '35.7°', azimuth: '240.3°' },
    'Uranus': { distanceAu: '19.22', distanceKm: '2,875,000,000', elevation: '20.1°', azimuth: '260.5°' },
    'Neptune': { distanceAu: '29.05', distanceKm: '4,345,000,000', elevation: '15.8°', azimuth: '280.2°' }
  });
  
  // Function to fetch data from NASA Horizons API
  const fetchPlanetaryData = async (lat: number, lng: number): Promise<() => void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching planetary data...');
      const data = await fetchAllPlanetsData(lat, lng);
      setPlanetaryData(data);
      setLastUpdated(new Date());
      console.log('Successfully fetched planetary data');
      
      // Set up refresh every 5 minutes
      const refreshTimer = setTimeout(() => {
        void fetchPlanetaryData(lat, lng);
      }, 5 * 60 * 1000);
      
      // Return cleanup function
      return () => clearTimeout(refreshTimer);
    } catch (err) {
      console.error('Error fetching planetary data:', err);
      const errorMessage = 'Failed to load real-time data. Using sample data instead.';
      setError(errorMessage);
      // Fallback to sample data
      setPlanetaryData(getSampleDataForAllPlanets());
    } finally {
      setLoading(false);
    }
    
    // Return empty cleanup function in case of error
    return () => {};
  };

  // Initialize location and fetch data
  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | null = null;
    
    const initializeLocation = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Try to get cached location first
        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
          try {
            const { latitude, longitude, timestamp } = JSON.parse(cachedLocation);
            // Use cached location if it's less than 1 hour old
            if (Date.now() - timestamp < 3600000) { // 1 hour in ms
              const coords = { lat: latitude, lng: longitude };
              setUserCoords(coords);
              cleanup = await fetchPlanetaryData(coords.lat, coords.lng);
              return;
            }
          } catch (e) {
            console.warn('Error parsing cached location:', e);
          }
        }
        
        // If no valid cache, try to get fresh location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              if (!isMounted) return;
              
              const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              
              // Cache the location
              localStorage.setItem('userLocation', JSON.stringify({
                latitude: coords.lat,
                longitude: coords.lng,
                timestamp: Date.now()
              }));
              
              setUserCoords(coords);
              cleanup = await fetchPlanetaryData(coords.lat, coords.lng);
              
              // Update the global window object if it exists
              if (typeof window !== 'undefined') {
                window.currentUserLocation = { 
                  latitude: coords.lat, 
                  longitude: coords.lng,
                  city: 'Fetched Locally'
                };
              }
            },
            async (error) => {
              if (!isMounted) return;
              
              console.warn('Geolocation error:', error);
              // Use default coordinates
              setUserCoords(defaultCoords);
              setError("Location permission denied. Using default coordinates (Gaibandha, Bangladesh).");
              cleanup = await fetchPlanetaryData(defaultCoords.lat, defaultCoords.lng);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000, // 10 seconds
              maximumAge: 3600000 // 1 hour
            }
          );
        } else {
          // Fallback to default coordinates if geolocation is not supported
          setUserCoords(defaultCoords);
          setError("Geolocation not supported. Using default coordinates (Gaibandha, Bangladesh).");
          cleanup = await fetchPlanetaryData(defaultCoords.lat, defaultCoords.lng);
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error initializing location:', error);
        setError('Could not determine your location. Using default coordinates instead.');
        setUserCoords(defaultCoords);
        cleanup = await fetchPlanetaryData(defaultCoords.lat, defaultCoords.lng);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeLocation();
    
    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const getPlanetIcon = (planetName: string) => {
    if (planetName === "Sun") return <SunIcon className="text-yellow-400 h-6 w-6"/>;
    if (planetName === "Moon") return <MoonIconLucide className="text-gray-400 h-6 w-6"/>;
    return <Sparkles className="text-primary h-6 w-6" />; // Default for planets
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="px-4 sm:px-6 lg:px-8 py-6 mb-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <Globe className="h-10 w-10 text-primary" />
          <CardTitle className="text-3xl sm:text-4xl font-bold text-foreground">Our Solar System</CardTitle>
        </div>
        <CardDescription className="text-lg text-muted-foreground">
          Explore current positions and information about planets and major bodies in our solar system for today, {format(today, 'MMMM d, yyyy')}.
          {userCoords && userCoords.lat !== 0 && ` (Observer: ${userCoords.lat.toFixed(2)}°, ${userCoords.lng.toFixed(2)}°)`}
        </CardDescription>
      </header>
      <div className="flex-grow overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card className="w-full animate-fade-in animation-delay-200 shadow-xl bg-card border border-border flex-grow flex flex-col overflow-hidden">
          <CardContent className="space-y-6 text-base leading-relaxed py-6 flex-grow overflow-y-auto">

            <div className="aspect-video bg-black rounded-lg my-6 shadow-xl overflow-hidden relative border border-border">
              <iframe
                src="https://eyes.nasa.gov/apps/orrery/"
                title="NASA's Eyes on the Solar System"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
                <p className="text-sm text-white/80">Interactive 3D Solar System by NASA's Eyes</p>
              </div>
            </div>

            {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-md flex items-center justify-center gap-2"><AlertTriangle className="h-5 w-5" />{error}</p>}

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading real-time planetary data...</p>
              </div>
            ) : Object.keys(planetaryData).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {Object.entries(planetaryData).map(([planetName, data]) => (
                  <Card key={planetName} className="bg-background/70 shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out border">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2 text-primary">
                        {getPlanetIcon(planetName)}
                        {planetName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {data.distanceKm && data.distanceAu ? (
                        <p>
                          <strong>Distance:</strong> {data.distanceKm} km ({data.distanceAu} AU)
                        </p>
                      ) : (
                        <p><strong>Distance:</strong> N/A</p>
                      )}
                      {data.elevation && <p><strong>Elevation:</strong> {data.elevation}</p>}
                      {data.azimuth && <p><strong>Azimuth:</strong> {data.azimuth}</p>}
                      {planetName === "Sun" && data.solarFlux && (
                        <p><strong>Solar Flux:</strong> {data.solarFlux}</p>
                      )}
                      {planetName === "Moon" && data.illumination && (
                        <p><strong>Illumination:</strong> {data.illumination}</p>
                      )}
                      {planetName === "Moon" && data.phase && (
                        <p><strong>Phase:</strong> {data.phase}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              !error && <p className="text-center text-muted-foreground py-10">No planetary data available at this moment.</p>
            )}

            <p className="text-center text-muted-foreground text-sm italic py-4 mt-6">
              Real-time planetary data fetched from NASA's Horizons System. 
              {lastUpdated && ` Last updated: ${format(lastUpdated, 'hh:mm:ss a')}`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    