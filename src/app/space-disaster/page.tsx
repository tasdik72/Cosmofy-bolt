

"use client";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle, ShieldAlert, Bell, Wind as HssIcon, Loader2, ExternalLink, ChevronLeft, ChevronRight, Biohazard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchDonkiData, type NasaDonkiApiEndpoint } from '@/services/nasaApi';
import { format, parseISO, isValid } from 'date-fns';
import type { LucideIcon } from 'lucide-react';

interface NeoData {
  id: string;
  name: string;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: {
    close_approach_date_full: string;
    relative_velocity: {
      kilometers_per_second: string;
    };
    miss_distance: {
      kilometers: string;
    };
  }[];
  nasa_jpl_url?: string;
}

interface DonkiEvent {
  [key: string]: any;
}

interface DisasterEventType {
 id: NasaDonkiApiEndpoint;
 name: string;
 icon: LucideIcon;
 params?: any;
 description?: string;
}

const disasterEventTypes: DisasterEventType[] = [
  { id: 'NEO', name: 'Near-Earth Objects (Today)', icon: Biohazard, params: { useTodayOnly: true }, description: "Potentially hazardous asteroids and comets passing near Earth today." },
  { id: 'GST', name: 'Geomagnetic Storms', icon: ShieldAlert, description: "Disturbances in Earth's magnetosphere, potentially impacting technology." },
  { id: 'HSS', name: 'High Speed Streams', icon: HssIcon, description: "Fast solar wind streams that can cause geomagnetic activity." },
  { id: 'notifications', name: 'DONKI Notifications', icon: Bell, params: { type: 'all' }, description: "General alerts and updates from NASA's DONKI system." },
];

export default function SpaceDisasterPage() {
  const [disasterData, setDisasterData] = useState<Record<string, DonkiEvent[] | NeoData[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentEventIndexes, setCurrentEventIndexes] = useState<Record<NasaDonkiApiEndpoint, number>>({
    CME: 0,
    FLR: 0,
    SEP: 0,
    MPC: 0,
    RBE: 0,
    IPS: 0,
    GST: 0,
    NEO: 0,
    HSS: 0,
    notifications: 0
  });

  useEffect(() => {
    const initialIndexes: Record<NasaDonkiApiEndpoint, number> = {} as Record<NasaDonkiApiEndpoint, number>;
    disasterEventTypes.forEach(type => initialIndexes[type.id] = 0);
    setCurrentEventIndexes(initialIndexes);

    const fetchDataForAllTypes = async () => {
      let localErrorMessages: string[] = [];
      setError(null);

      const initialLoadingStates: Record<string, boolean> = {};
      disasterEventTypes.forEach(type => initialLoadingStates[type.id] = true);
      setLoadingStates(initialLoadingStates);

      const dataPromises = disasterEventTypes.map(eventType => {
        const today = new Date().toISOString().split('T')[0];
        let startDate = today;
        let endDate = today;

        if (!eventType.params?.useTodayOnly) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          startDate = sevenDaysAgo.toISOString().split('T')[0];
        }
        
        const apiParams: any = { start_date: startDate, end_date: endDate };
        if (eventType.params?.type) apiParams.type = eventType.params.type;

        return fetchDonkiData(eventType.id, apiParams)
          .then(data => {
            let processedData = [];
            if (eventType.id === 'NEO') {
              processedData = data?.near_earth_objects?.[today]?.slice(0, 10) || [];
            } else {
              processedData = Array.isArray(data) ? data.slice(-10).reverse() : []; 
            }
            return { typeId: eventType.id, data: processedData, status: 'fulfilled' as const };
          })
          .catch((err: any) => {
            console.error(`Error fetching ${eventType.name} data:`, err);
            localErrorMessages.push(`Failed to fetch ${eventType.name}: ${err.message || 'Unknown error'}.`);
            return { typeId: eventType.id, data: [], status: 'rejected' as const, error: err };
          });
      });

      const results = await Promise.allSettled(dataPromises);
      
      const newDisasterData: Record<string, DonkiEvent[] | NeoData[]> = {} as Record<string, DonkiEvent[] | NeoData[]>;
       disasterEventTypes.forEach(type => newDisasterData[type.id] = []); 
      const newLoadingStates: Record<string, boolean> = {};

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const value = result.value;
           if (value.status === 'fulfilled') {
            newDisasterData[value.typeId] = value.data;
          }
          newLoadingStates[value.typeId] = false;
        } else {
          const typeIdAttempt = (result.reason as any)?.typeId ?? disasterEventTypes.find(dt => result.reason?.message?.includes(dt.name))?.id;
          if (typeIdAttempt) {
            newLoadingStates[typeIdAttempt] = false;
            if (!localErrorMessages.some(e => e.includes(typeIdAttempt))) { 
                localErrorMessages.push(`Failed to load data for ${typeIdAttempt}`);
            }
          }
          console.error("A fetch promise was rejected:", result.reason);
        }
      });
      
      setDisasterData(newDisasterData);
      setLoadingStates(newLoadingStates);
      
      if (localErrorMessages.length > 0) {
        setError(localErrorMessages.join(' | '));
      }
    };

    fetchDataForAllTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handlePreviousEvent = (typeId: NasaDonkiApiEndpoint) => {
    setCurrentEventIndexes(prev => ({
      ...prev,
      [typeId]: Math.max(0, (prev[typeId] || 0) - 1)
    }));
  };

  const handleNextEvent = (typeId: NasaDonkiApiEndpoint) => {
    const totalEvents = disasterData[typeId]?.length || 0;
    setCurrentEventIndexes(prev => ({
      ...prev,
      [typeId]: Math.min(totalEvents > 0 ? totalEvents - 1 : 0, (prev[typeId] || 0) + 1)
    }));
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

  const renderNeoEventDetails = (neo: NeoData | null) => {
    if (!neo) return <p className="text-muted-foreground text-base text-center py-10">No NEO data to display for this item.</p>;
    return (
      <div className="p-4 space-y-1.5 min-h-[200px] flex flex-col text-base">
        <h4 className="font-semibold text-lg text-primary mb-1">{neo.name}</h4>
        <p className={`${neo.is_potentially_hazardous_asteroid ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
          {neo.is_potentially_hazardous_asteroid ? "Potentially Hazardous" : "Not Currently Hazardous"}
        </p>
        <p><strong>Est. Diameter:</strong> {neo.estimated_diameter.kilometers.estimated_diameter_min.toFixed(2)} - {neo.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2)} km</p>
        {neo.close_approach_data?.[0] && (
          <>
            <p><strong>Close Approach:</strong> {safeFormatDate(neo.close_approach_data[0].close_approach_date_full)}</p>
            <p><strong>Miss Distance:</strong> {parseFloat(neo.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km</p>
            <p><strong>Velocity:</strong> {parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(2)} km/s</p>
          </>
        )}
        <div className="mt-auto pt-2">
        {neo.nasa_jpl_url ? 
          <a href={neo.nasa_jpl_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
            More Info (JPL) <ExternalLink className="h-3.5 w-3.5"/>
          </a>
          : <a href="https://cneos.jpl.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
              NASA NEO Studies <ExternalLink className="h-3.5 w-3.5"/>
            </a>
        }
        </div>
      </div>
    );
  };

  const renderDonkiEventDetails = (event: DonkiEvent | null, type: string) => {
    if (!event) return <p className="text-muted-foreground text-base text-center py-10">No event data to display for this item.</p>;

    let title = event.messageType || event.activityID || `Event ID: ${event.gstID || event.hssID || event.notificationID || event.eventID || 'Unknown ID'}`;
    if (type === 'GST' && event.allKpIndex && event.allKpIndex.length > 0) {
      const maxKp = Math.max(...event.allKpIndex.map((kp: any) => kp.kpIndex));
      title = `Geomagnetic Storm: ${event.gstID || 'N/A'} (Max Kp: ${maxKp})`;
    } else if (type === 'HSS' && event.instruments && event.instruments.length > 0) {
       title = `High Speed Stream: ${event.hssID || 'N/A'} (Instruments: ${event.instruments.map((inst: any) => inst.displayName).join(', ')})`;
    } else if (type === 'notifications') {
        title = `Notification: ${event.messageType || 'General'} (${event.messageID?.substring(0,20) || 'ID N/A'}...)`;
    }

    const timeInfo = event.startTime || event.eventTime || event.messageIssueTime;
    let message = event.messageBody || event.note || "";
    if (message) {
        message = message.replace(/##\s*/g, '\n').replace(/<br\s*\/?>/gi, '\n').trim();
    }

    return (
      <div className="p-4 space-y-2 min-h-[200px] flex flex-col text-base">
        <h4 className="font-semibold text-lg text-primary mb-1">{title}</h4>
        {timeInfo && <p className="text-sm text-muted-foreground mb-2">Time: {safeFormatDate(timeInfo)}</p>}
        
        {message && <p className="text-foreground/90 text-base flex-grow"><span className="block whitespace-pre-line">{message}</span></p>}
        {!message && <p className="text-base text-muted-foreground flex-grow">No detailed message or note for this event.</p>}

        <div className="flex flex-wrap gap-2 items-center text-xs mt-auto pt-2">
          {event.messageURL ? 
            <a href={event.messageURL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
              View Message <ExternalLink className="h-3.5 w-3.5"/>
            </a> :
          event.link ?
            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
              More Info <ExternalLink className="h-3.5 w-3.5"/>
            </a> :
            <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
              NASA DONKI <ExternalLink className="h-3.5 w-3.5"/>
            </a>
          }
          {event.linkedEvents && event.linkedEvents.length > 0 && (
            <p className="text-sm"><strong>Linked Events:</strong> {event.linkedEvents.map((e: any) => e.activityID).join(', ')}</p>
          )}
        </div>
      </div>
    );
  };

  const neoEvent = disasterEventTypes.find(et => et.id === 'NEO')!;
  const gstEvent = disasterEventTypes.find(et => et.id === 'GST')!;
  const hssEvent = disasterEventTypes.find(et => et.id === 'HSS')!;
  const notificationEvent = disasterEventTypes.find(et => et.id === 'notifications')!;

  const renderCard = (eventType: DisasterEventType) => {
    const eventsForType = disasterData[eventType.id] || [];
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
            eventType.id === 'NEO' ? renderNeoEventDetails(currentEvent as NeoData) : renderDonkiEventDetails(currentEvent, eventType.id)
          ) : (
            <p className="text-muted-foreground py-10 text-base text-center h-48 flex items-center justify-center">No {eventType.name.toLowerCase()} data reported recently.</p>
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
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="px-4 sm:px-6 lg:px-8 py-6 mb-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <AlertTriangle className="h-10 w-10 text-primary" /> 
          <CardTitle className="text-3xl sm:text-4xl font-bold text-foreground">Space Disaster</CardTitle>
        </div>
        <CardDescription className="text-lg text-muted-foreground">
          Monitoring potential space-related threats using NASA's DONKI API (data typically for the last 7 days, NEOs for today).
        </CardDescription>
      </header>
      
      <div className="flex-grow overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error && <p className="text-destructive text-center p-4 bg-destructive/10 rounded-md flex items-center justify-center gap-2 text-sm mb-4"><AlertTriangle className="h-5 w-5" />{error}</p>}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column for NEO, GST, HSS */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {renderCard(neoEvent)}
            {renderCard(gstEvent)}
            {renderCard(hssEvent)}
          </div>
          {/* Column for DONKI Notifications */}
          <div className="lg:col-span-2">
            {renderCard(notificationEvent)}
          </div>
        </div>

        <p className="text-center text-muted-foreground text-xs italic py-6 mt-6">
          This page provides a summary of potential space threats. Always refer to official sources for critical information.
        </p>
      </div>
    </div>
  );
}
