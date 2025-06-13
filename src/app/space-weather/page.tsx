
"use client";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle, Loader2, ExternalLink, Zap, Sun, Atom, Sigma, BrainCircuit, Wind as WindIcon, ChevronLeft, ChevronRight, Thermometer, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchDonkiData, type NasaDonkiApiEndpoint } from '@/services/nasaApi';
import { Badge } from '@/components/ui/badge';
import { format, subDays, parseISO, isValid } from 'date-fns';

interface DonkiDataItem {
  [key: string]: any;
}

const eventTypes: { id: NasaDonkiApiEndpoint; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'CME', name: 'Coronal Mass Ejections', icon: Zap, description: "Large expulsions of plasma and magnetic field from the Sun's corona." },
  { id: 'FLR', name: 'Solar Flares', icon: Sun, description: "Intense bursts of radiation arising from the release of magnetic energy on the Sun." },
  { id: 'SEP', name: 'Solar Energetic Particles', icon: Atom, description: "High-energy particles accelerated by solar events, posing radiation hazards." },
  { id: 'MPC', name: 'Magnetopause Crossings', icon: Sigma, description: "Events where Earth's magnetosphere boundary is crossed by spacecraft or solar wind features." },
  { id: 'RBE', name: 'Radiation Belt Enhancements', icon: BrainCircuit, description: "Increases in particle flux in Earth's radiation belts, affecting satellites." },
  { id: 'IPS', name: 'Interplanetary Shocks', icon: WindIcon, description: "Shock waves traveling through the solar system, often preceding geomagnetic storms." },
];

const summaryDataTypes: { id: NasaDonkiApiEndpoint; name: string; icon: React.ElementType, description: string }[] = [
    { id: 'GST', name: 'Geomagnetic Activity', icon: Waves, description: "Disturbances in Earth's magnetic field, often causing auroras and impacting grids." },
    { id: 'HSS', name: 'High Speed Streams', icon: WindIcon, description: "Fast solar wind from coronal holes, capable of inducing geomagnetic activity." },
];

export default function SpaceWeatherPage() {
  const [eventData, setEventData] = useState<Record<NasaDonkiApiEndpoint, DonkiDataItem[]>>({
    CME: [], FLR: [], SEP: [], MPC: [], RBE: [], IPS: [], GST: [], HSS: [], NEO: [], notifications: []
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentEventIndexes, setCurrentEventIndexes] = useState<Record<NasaDonkiApiEndpoint, number>>({});
  const [currentGstSummaryIndex, setCurrentGstSummaryIndex] = useState(0);
  const [currentHssSummaryIndex, setCurrentHssSummaryIndex] = useState(0);


  useEffect(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const initialIndexes: Record<NasaDonkiApiEndpoint, number> = {} as Record<NasaDonkiApiEndpoint, number>;
    const allTypesToFetch = [...summaryDataTypes, ...eventTypes];
    allTypesToFetch.forEach(type => initialIndexes[type.id] = 0);
    setCurrentEventIndexes(initialIndexes);

    const fetchAllData = async () => {
      let localErrorMessages: string[] = [];
      setError(null);
      
      const initialLoadingStates: Record<string, boolean> = {};
      allTypesToFetch.forEach(type => initialLoadingStates[type.id] = true);
      setLoadingStates(initialLoadingStates);

      const dataPromises = allTypesToFetch.map(type => 
        fetchDonkiData(type.id, { start_date: startDate, end_date: today })
          .then(data => ({ typeId: type.id, data: Array.isArray(data) ? data.reverse() : [], status: 'fulfilled' as const }))
          .catch(err => {
            console.error(`Error fetching ${type.name} data:`, err);
            localErrorMessages.push(`Failed to load ${type.name}: ${err.message || 'Unknown error'}`);
            return { typeId: type.id, data: [], status: 'rejected' as const, error: err };
          })
      );

      const results = await Promise.allSettled(dataPromises);
      
      const newEventData: Record<NasaDonkiApiEndpoint, DonkiDataItem[]> = {} as Record<NasaDonkiApiEndpoint, DonkiDataItem[]>;
      allTypesToFetch.forEach(type => newEventData[type.id] = []); 
      const newLoadingStates: Record<string, boolean> = {};

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (value.status === 'fulfilled') {
            newEventData[value.typeId] = value.data;
          }
          newLoadingStates[value.typeId] = false;
        } else {
          const typeIdAttempt = (result.reason as any)?.typeId ?? allTypesToFetch.find(dt => result.reason?.message?.includes(dt.name))?.id;
          if (typeIdAttempt) {
            newLoadingStates[typeIdAttempt] = false;
             if (!localErrorMessages.some(e => e.includes(typeIdAttempt))) { 
                localErrorMessages.push(`Failed to load data for ${typeIdAttempt}`);
            }
          }
          console.error("A fetch promise was rejected:", result.reason);
        }
      });
      
      setEventData(newEventData);
      setLoadingStates(newLoadingStates);
      
      if (localErrorMessages.length > 0) {
        setError(localErrorMessages.join(' | '));
      }
    };

    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreviousEvent = (typeId: NasaDonkiApiEndpoint) => {
    setCurrentEventIndexes(prev => ({
      ...prev,
      [typeId]: Math.max(0, (prev[typeId] || 0) - 1)
    }));
  };

  const handleNextEvent = (typeId: NasaDonkiApiEndpoint) => {
    setCurrentEventIndexes(prev => ({
      ...prev,
      [typeId]: Math.min((eventData[typeId]?.length || 1) - 1, (prev[typeId] || 0) + 1)
    }));
  };

  const handlePreviousSummary = (type: 'GST' | 'HSS') => {
    if (type === 'GST') {
        setCurrentGstSummaryIndex(prev => Math.max(0, prev - 1));
    } else {
        setCurrentHssSummaryIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextSummary = (type: 'GST' | 'HSS') => {
    const totalItems = type === 'GST' ? (eventData.GST?.length || 0) : (eventData.HSS?.length || 0);
    if (type === 'GST') {
        setCurrentGstSummaryIndex(prev => Math.min(totalItems > 0 ? totalItems - 1 : 0, prev + 1));
    } else {
        setCurrentHssSummaryIndex(prev => Math.min(totalItems > 0 ? totalItems - 1 : 0, prev + 1));
    }
  };
  
  const safeFormatDate = (dateString: string | undefined | null, formatString: string = 'PPpp'): string => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, formatString);
      }
      // Attempt to fix common non-ISO date format if parseISO fails
      const alternativeParsedDate = new Date(dateString.replace(" ", "T"));
      if(isValid(alternativeParsedDate)) {
          return format(alternativeParsedDate, formatString);
      }
      return dateString; // Return original if still not parsable
    } catch (e) {
      console.warn("Date formatting failed for:", dateString, e);
      return dateString; // Fallback to original string on error
    }
  };

  const renderEventItemDetails = (event: DonkiDataItem | null, type: NasaDonkiApiEndpoint) => {
    if (!event) {
      return <p className="text-muted-foreground text-base text-center py-10">No event data to display for this item.</p>;
    }

    let title = event.activityID || event.flrID || event.sepID || event.mpcID || event.rbeID || event.ipsID || `Event ${event.catalog || event.eventID || event.gstID || event.hssID || 'Unknown ID'}`;
    let timeInfo = event.startTime || event.beginTime || event.eventTime || (event.cmeAnalyses && event.cmeAnalyses[0]?.time21_5) || (event.peakTime);
    let notes = event.note || event.notes || (event.cmeAnalyses && event.cmeAnalyses[0]?.note) || "";
    if (notes) {
        notes = notes.replace(/##\s*/g, '\n').replace(/<br\s*\/?>/gi, '\n').trim();
    }
    
    const link = event.link || (event.cmeAnalyses && event.cmeAnalyses[0]?.link) || (event.links && event.links.length > 0 ? event.links[0].url : null);
    
    const defaultNasaLink = `https://www.swpc.noaa.gov/phenomena/${type.toLowerCase().replace('_', '-')}`;


    let detailsElements: React.ReactNode[] = [];

    if (type === 'CME' && event.cmeAnalyses && event.cmeAnalyses.length > 0) {
        const analysis = event.cmeAnalyses[0];
        title = `CME: ${event.activityID}`;
        if(analysis.time21_5) detailsElements.push(<p key="cme-time"><strong>Detection Time (21.5 R☉):</strong> {safeFormatDate(analysis.time21_5)}</p>);
        if(analysis.speed) detailsElements.push(<p key="cme-speed"><strong>Speed:</strong> {analysis.speed || 'N/A'} km/s</p>);
        if(analysis.type) detailsElements.push(<p key="cme-type"><strong>Type:</strong> {analysis.type || 'N/A'}</p>);
        if (analysis.latitude && analysis.longitude) {
          detailsElements.push(<p key="cme-coords"><strong>Coordinates:</strong> Lat {analysis.latitude}, Lon {analysis.longitude}</p>);
        }
        if (analysis.halfAngle) {
            detailsElements.push(<p key="cme-halfAngle"><strong>Half Angle:</strong> {analysis.halfAngle}°</p>);
        }
        if (analysis.note) { 
            detailsElements.push(<p key="cme-analysis-note" className="mt-1 text-base"><strong className="block">Analysis Note:</strong> <span className="block whitespace-pre-line">{analysis.note.replace(/##\s*/g, '').replace(/<br\s*\/?>/gi, '\n').trim()}</span></p>);
        }
    } else if (type === 'FLR') {
        title = `Flare: ${event.classType || 'N/A'} (${event.flrID})`;
        if(event.beginTime) detailsElements.push(<p key="flr-begin"><strong>Begin:</strong> {safeFormatDate(event.beginTime)}</p>);
        if(event.peakTime) detailsElements.push(<p key="flr-peak"><strong>Peak:</strong> {safeFormatDate(event.peakTime)}</p>);
        if(event.endTime) detailsElements.push(<p key="flr-end"><strong>End:</strong> {safeFormatDate(event.endTime)}</p>);
        if(event.sourceLocation) detailsElements.push(<p key="flr-loc"><strong>Location:</strong> {event.sourceLocation}</p>);
    } else if (type === 'SEP') {
        title = `SEP: ${event.eventID || 'N/A'}`;
        if(event.eventTime) detailsElements.push(<p key="sep-time"><strong>Event Time:</strong> {safeFormatDate(event.eventTime)}</p>);
        if(event.instruments && event.instruments.length > 0) {
            detailsElements.push(<p key="sep-instruments"><strong>Instruments:</strong> {event.instruments.map((i:any) => i.displayName).join(', ')}</p>);
        }
    } else if (type === 'MPC') {
        title = `MPC: ${event.mpcID || 'N/A'}`;
        if(event.eventTime) detailsElements.push(<p key="mpc-time"><strong>Event Time:</strong> {safeFormatDate(event.eventTime)}</p>);
    } else if (type === 'RBE') {
        title = `RBE: ${event.rbeID || 'N/A'}`;
        if(event.eventTime) detailsElements.push(<p key="rbe-time"><strong>Event Time:</strong> {safeFormatDate(event.eventTime)}</p>);
    } else if (type === 'IPS') {
        title = `IPS: ${event.ipsID || 'N/A'} (${event.catalog || 'N/A'})`;
        if(event.eventTime) detailsElements.push(<p key="ips-time"><strong>Event Time:</strong> {safeFormatDate(event.eventTime)}</p>);
        if(event.location) detailsElements.push(<p key="ips-loc"><strong>Location:</strong> {event.location}</p>);
    }

    if (notes && type !== 'CME') { 
        detailsElements.push(<p key="main-note" className="mt-1 text-base"><strong className="block">Note:</strong> <span className="block whitespace-pre-line">{notes}</span></p>);
    }
    
    return (
      <div className="p-4 space-y-2 min-h-[250px] flex flex-col text-base">
        <h4 className="font-semibold text-lg text-primary mb-1">{title}</h4>
        {timeInfo && type !== 'CME' && type !== 'FLR' && <p className="text-sm text-muted-foreground mb-2">Time: {safeFormatDate(timeInfo)}</p>}
        <div className="space-y-1.5 flex-grow text-base">
            {detailsElements.length > 0 ? detailsElements : <p className="text-muted-foreground">No specific details available for this event.</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-center text-xs mt-auto pt-2">
          {event.sourceLocation && type !== 'FLR' && <Badge variant="outline">Source: {event.sourceLocation}</Badge>}
          {event.classType && type !== 'FLR' && <Badge variant="secondary">Class: {event.classType}</Badge>}
          <a href={link || defaultNasaLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
              More Info <ExternalLink className="h-3.5 w-3.5"/>
          </a>
        </div>
      </div>
    );
  };

  const renderSummaryItem = (item: DonkiDataItem | null, type: 'GST' | 'HSS') => {
    if (!item) {
      return <p className="text-muted-foreground text-base text-center py-10">No summary data to display.</p>;
    }
    let content;
    if (type === 'GST' && item) {
      content = (
        <>
          <p><strong>ID:</strong> {item.gstID}</p>
          {item.startTime && <p><strong>Time:</strong> {safeFormatDate(item.startTime)}</p>}
          {item.allKpIndex && item.allKpIndex.length > 0 && (
            <p><strong>Max Kp:</strong> {Math.max(...item.allKpIndex.map((kp: any) => kp.kpIndex))}</p>
          )}
        </>
      );
    } else if (type === 'HSS' && item) {
      content = (
        <>
          <p><strong>ID:</strong> {item.hssID}</p>
          {item.eventTime && <p><strong>Time:</strong> {safeFormatDate(item.eventTime)}</p>}
          {item.instruments && item.instruments.length > 0 && (
            <p><strong>Instruments:</strong> {item.instruments.map((inst: any) => inst.displayName).join(', ')}</p>
          )}
        </>
      );
    }
    return (
        <div className="space-y-1 text-base p-2 min-h-[100px]">
            {content}
            {item.link && 
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
                Details <ExternalLink className="h-3.5 w-3.5"/>
            </a>
            }
        </div>
    );
  };


  return (
    <div className="h-full flex flex-col bg-background">
      <header className="px-4 sm:px-6 lg:px-8 py-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl sm:text-4xl font-bold text-foreground">Space Weather Center</CardTitle>
          </div>
          <p className="text-lg text-muted-foreground">
            Latest solar activity from NASA's DONKI API (past 7 days).
          </p>
      </header>

      <div className="flex-grow overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-md flex items-center justify-center gap-2 mb-4 text-sm"><AlertTriangle className="h-5 w-5" />{error}</p>}
        
        <h3 className="text-2xl font-semibold text-foreground mt-2 mb-4 pb-2 border-b border-border/80 flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-primary" /> Activity Summaries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {summaryDataTypes.map(dataType => {
            const summaryItems = eventData[dataType.id] || [];
            const currentIndex = dataType.id === 'GST' ? currentGstSummaryIndex : currentHssSummaryIndex;
            const currentItem = summaryItems.length > 0 ? summaryItems[currentIndex] : null;
            const totalItems = summaryItems.length;

            return (
              <Card key={dataType.id} className="bg-card shadow-md border border-border rounded-xl flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-primary flex items-center gap-2">
                        <dataType.icon className="h-6 w-6 text-primary"/> {dataType.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground pt-1">{dataType.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 flex-grow">
                    {loadingStates[dataType.id] ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
                    currentItem ? (
                        renderSummaryItem(currentItem, dataType.id as 'GST' | 'HSS')
                    ) : <p className="text-base text-muted-foreground h-24 flex items-center justify-center">No recent {dataType.name.toLowerCase()} data.</p>}
                </CardContent>
                {totalItems > 0 && (
                    <CardFooter className="text-sm text-muted-foreground py-2 px-4 border-t flex justify-between items-center mt-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreviousSummary(dataType.id as 'GST' | 'HSS')}
                            disabled={currentIndex === 0 || loadingStates[dataType.id]}
                            aria-label={`Previous ${dataType.name} summary`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-base">Item {currentIndex + 1} of {totalItems}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNextSummary(dataType.id as 'GST' | 'HSS')}
                            disabled={currentIndex >= totalItems - 1 || loadingStates[dataType.id]}
                            aria-label={`Next ${dataType.name} summary`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
        
        <h3 className="text-2xl font-semibold text-foreground mt-10 mb-4 pb-2 border-b border-border/80 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Detailed Event Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {eventTypes.map((eventType) => {
            const eventsForType = eventData[eventType.id] || [];
            const currentIndex = currentEventIndexes[eventType.id] || 0;
            const currentEvent = eventsForType.length > 0 ? eventsForType[currentIndex] : null;
            const totalEvents = eventsForType.length;

            return (
              <Card key={eventType.id} className="flex flex-col bg-card shadow-lg border border-border rounded-xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <eventType.icon className="h-7 w-7 text-primary" />
                    <CardTitle className="text-xl text-primary">{eventType.name}</CardTitle>
                    {loadingStates[eventType.id] && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground ml-auto" />}
                  </div>
                  <CardDescription className="text-sm text-muted-foreground pt-1">{eventType.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-2 flex flex-col justify-between">
                  {loadingStates[eventType.id] ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : currentEvent ? (
                    renderEventItemDetails(currentEvent, eventType.id)
                  ) : (
                    <p className="text-muted-foreground py-10 text-base text-center h-48 flex items-center justify-center">No {eventType.name.toLowerCase()} data reported in the last 7 days.</p>
                  )}
                </CardContent>
                { totalEvents > 0 && (
                    <CardFooter className="text-sm text-muted-foreground py-2 px-4 border-t flex justify-between items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreviousEvent(eventType.id)}
                            disabled={currentIndex === 0 || loadingStates[eventType.id]}
                            aria-label={`Previous ${eventType.name} event`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-base">Event {currentIndex + 1} of {totalEvents}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNextEvent(eventType.id)}
                            disabled={currentIndex >= totalEvents - 1 || loadingStates[eventType.id]}
                            aria-label={`Next ${eventType.name} event`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </CardFooter>
                )}
              </Card>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground text-xs italic py-6 mt-6">
          Data sourced from NASA's DONKI API. For detailed analysis, refer to official NASA resources.
        </p>
      </div>
    </div>
  );
}
