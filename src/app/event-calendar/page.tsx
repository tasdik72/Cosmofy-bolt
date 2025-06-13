"use client";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { CalendarDays, Rocket, Sun, Moon as MoonIconLucide, Loader2, AlertTriangle, Satellite, MapPin, Telescope, ChevronLeft, ChevronRight, Sparkles, ExternalLink, MapPinned } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getVisualPasses as getN2YOVisualPasses, type VisualPassesParams } from '@/services/n2yoApi';
import { getPlanetaryPositions, getMoonPhase, type PlanetaryPositionsParams, type MoonPhaseParams } from '@/services/astronomyApi';
import { searchAstrocatsEvents } from '@/services/astrocatsApi';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isSameDay, isValid } from 'date-fns';

declare global {
  interface Window {
    currentUserLocation?: { latitude: number; longitude: number; city?: string; altitude?: number };
  }
}

interface N2YOPass {
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

interface AstroPlanetData {
    id: string;
    name: string;
    distance?: { km?: string; au?: string; };
    position?: {
        constellation?: { id: string, name: string };
        horizonal?: { altitude?: { degrees?: string, string?: string }, azimuth?: { degrees?: string, string?: string } };
    };
}

interface MoonPhaseData {
    imageUrl: string;
    phase?: {
        name?: string;
        fraction?: number; // Not directly used but part of API
        angle?: number;   // Not directly used but part of API
    };
    illumination?: number;
    [key: string]: any; // Allow other properties
}

interface SolarSystemBody {
  id: string;
  name: string;
  englishName: string;
  isPlanet: boolean;
  mass?: { massValue: number; massExponent: number };
  meanRadius?: number;
  sideralOrbit?: number;
  sideralRotation?: number;
  discoveredBy?: string;
  discoveryDate?: string;
  alternativeName?: string;
  moons?: { moon: string }[];
  density?: number;
  gravity?: number;
  meanTemperature?: number;
  [key: string]: any;
}

interface CalendarEvent {
    date: Date;
    title: string;
    type: string;
    icon: React.ElementType;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined;
    details: string;
    time?: string;
    location?: string;
    source: 'static' | 'n2yo' | 'astronomy' | 'astrocats' | 'solarsystem';
    link?: string;
}

interface StaticEvent {
  dateStr: string;
  time?: string;
  title: string;
  type: string;
  icon: React.ElementType;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined;
  location?: string;
  details: string;
}

const staticEvents: StaticEvent[] = [
    { dateStr: '2024-08-12', time: 'Peak Night', title: 'Perseids Meteor Shower', type: 'Meteor Shower', icon: Telescope, badgeVariant: 'secondary', location: 'Northern Hemisphere', details: 'One of the most prolific meteor showers, known for bright meteors.' },
    { dateStr: '2024-10-02', time: 'Visible Evening', title: 'Annular Solar Eclipse', type: 'Eclipse', icon: Sun, badgeVariant: 'outline', location: 'South America (Chile, Argentina)', details: 'The Moon will cover the Sun\'s center, leaving a "ring of fire" visible.' },
    { dateStr: '2024-12-13', time: 'Peak Night', title: 'Geminids Meteor Shower', type: 'Meteor Shower', icon: Telescope, badgeVariant: 'secondary', location: 'Visible Globally', details: 'Often the best meteor shower of the year, with many bright meteors.' },
    { dateStr: '2025-03-29', time: 'Visible', title: 'Partial Solar Eclipse', type: 'Eclipse', icon: Sun, badgeVariant: 'outline', location: 'Europe, N. Africa, N. Asia', details: 'A portion of the Sun will be obscured by the Moon.' },
];

interface AstrocatsEvent {
  name: string;
  discoverdate?: Array<{ value: string }>;
  claimedtype?: Array<{ value: string }>;
}

export default function EventCalendarPage() {
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number, alt: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [currentDayEventIndex, setCurrentDayEventIndex] = useState(0);

  const [planetaryPositions, setPlanetaryPositions] = useState<AstroPlanetData[]>([]);
  const [moonPhase, setMoonPhase] = useState<MoonPhaseData | null>(null);

  const [solarSystemBodies, setSolarSystemBodies] = useState<SolarSystemBody[]>([]);
  const [loading, setLoading] = useState({ 
    iss: false, 
    planets: false, 
    moon: false, 
    astrocats: false, 
    solarsystem: false, 
    initial: true 
  });

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              alt: position.coords.altitude || 0
            };
            setUserCoords(newCoords);
            setLoading(prev => ({ ...prev, initial: false }));
            toast({
              title: "Location Acquired",
              description: "Using your current location for precise event data.",
              variant: "default"
            });
          },
          (error) => {
            console.error("Location error:", error);
            setLoading(prev => ({ ...prev, initial: false }));
            setError("Location permission denied. Please enable location services for accurate event data.");
            toast({
              title: "Location Error",
              description: "Please enable location services for accurate event data.",
              variant: "destructive"
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
    } else {
       setLoading(prev => ({ ...prev, initial: false }));
        setError("Geolocation not supported by your browser");
        toast({
          title: "Geolocation Not Supported",
          description: "Your browser doesn't support geolocation. Some features will be limited.",
          variant: "destructive"
        });
      }
    };

    getLocation();
  }, [toast]);

  const fetchSolarSystemData = async () => {
    setLoading(prev => ({ ...prev, solarsystem: true }));
    try {
      const response = await fetch('https://api.le-systeme-solaire.net/rest/bodies/');
      if (!response.ok) throw new Error('Failed to fetch solar system data');
      const data = await response.json();
      setSolarSystemBodies(data.bodies || []);
    } catch (error) {
      console.error('Error fetching solar system data:', error);
      setError(prev => prev ? `${prev} | Solar System data unavailable` : 'Solar System data unavailable');
    } finally {
      setLoading(prev => ({ ...prev, solarsystem: false }));
    }
  };

  const fetchSatellitePasses = async (satelliteIds: number[]) => {
    if (!userCoords) return [];
    
    const passes: CalendarEvent[] = [];
    for (const satId of satelliteIds) {
      try {
        const data = await getN2YOVisualPasses(satId, {
          observer_lat: userCoords.lat,
          observer_lng: userCoords.lng,
          observer_alt: userCoords.alt,
          days: 1,
          min_visibility: 30
        });
        
        if (data.passes) {
          passes.push(...data.passes.map((pass: N2YOPass) => ({
            date: new Date(pass.startUTC * 1000),
            title: `${pass.satname || `Satellite ${satId}`} Visual Pass`,
                    type: 'Satellite Pass',
                    icon: Satellite,
                    badgeVariant: 'outline',
            details: `Max El: ${pass.maxEl?.toFixed(1) ?? 'N/A'}°, Mag: ${pass.mag?.toFixed(1) ?? 'N/A'}, Dur: ${pass.duration}s. Starts: ${pass.startAzCompass} at ${format(new Date(pass.startUTC * 1000), 'p')}.`,
            time: format(new Date(pass.startUTC * 1000), 'p'),
                    location: `Visible from your location`,
                    source: 'n2yo' as const,
          })));
        }
      } catch (error) {
        console.error(`Error fetching passes for satellite ${satId}:`, error);
      }
    }
    return passes;
  };

  const fetchN2YOLaunches = async () => {
    try {
      // Using the official N2YO API endpoint for launches
      const response = await fetch('https://api.n2yo.com/launches/upcoming', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`N2YO API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data into our event format
      return data.launches?.map((launch: any) => ({
        date: new Date(launch.launch_date),
        name: launch.name || 'Space Launch',
        description: launch.description || 'Space launch event',
        location: launch.location || 'Launch Site',
        url: launch.url || `https://www.n2yo.com/launches/?id=${launch.id}`
      })) || [];
    } catch (error) {
      console.error('Error fetching N2YO launches:', error);
      // Return empty array instead of throwing to prevent app from breaking
      return [];
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const fetchAllEvents = async () => {
        setLoading(prev => ({ ...prev, iss: true, planets: true, moon: true, astrocats: true, solarsystem: true }));
        
        try {
          // Fetch static events
          const staticEventsForDate = staticEvents
            .filter(se => isSameDay(parseISO(se.dateStr), selectedDate))
            .map(se => ({ ...se, date: parseISO(se.dateStr), source: 'static' as const }));

          // Fetch satellite passes if location is available
          let satellitePasses: CalendarEvent[] = [];
          if (userCoords) {
            try {
              satellitePasses = await fetchSatellitePasses([25544, 20580, 25338, 28654]);
            } catch (error) {
              console.error('Error fetching satellite passes:', error);
              // Continue with other data even if satellite passes fail
            }
          }

          // Fetch N2YO launches
          let launchEvents: CalendarEvent[] = [];
          try {
            const launches = await fetchN2YOLaunches();
            launchEvents = launches
              .filter((launch: any) => isSameDay(new Date(launch.date), selectedDate))
              .map((launch: any) => ({
                date: new Date(launch.date),
                title: launch.name,
                type: 'Launch',
                icon: Rocket,
                badgeVariant: 'destructive' as const,
                details: launch.description || 'Space launch event',
                time: format(new Date(launch.date), 'p'),
                location: launch.location || 'Launch Site',
                source: 'n2yo' as const,
                link: launch.url
              }));
          } catch (error) {
            console.error('Error processing launch events:', error);
            // Continue with other data even if launch events fail
          }

          // Combine all events
          const allEventsForDate = [
            ...staticEventsForDate,
            ...satellitePasses,
            ...launchEvents
          ].sort((a, b) => a.date.getTime() - b.date.getTime());

          setAllEvents(allEventsForDate);
        } catch (error) {
          console.error('Error fetching events:', error);
          setError('Failed to fetch some events. Please try again later.');
        } finally {
          setLoading(prev => ({ ...prev, iss: false, planets: false, moon: false, astrocats: false, solarsystem: false }));
        }
      };

      fetchAllEvents();
    }
  }, [selectedDate, userCoords]);

  const eventsForSelectedDate = allEvents; // No need to re-filter, allEvents is already for the selected date
  const currentDisplayedEvent = eventsForSelectedDate.length > 0 ? eventsForSelectedDate[currentDayEventIndex] : null;
  const eventDaysOnCalendar = staticEvents.map(event => parseISO(event.dateStr)).filter(date => isValid(date)); // Only for static events for calendar markers initially

  const handlePreviousDayEvent = () => {
    setCurrentDayEventIndex(prev => Math.max(0, prev - 1));
  };
  const handleNextDayEvent = () => {
    setCurrentDayEventIndex(prev => Math.min(eventsForSelectedDate.length > 0 ? eventsForSelectedDate.length - 1 : 0, prev + 1));
  };

  const isAnyDataLoading = loading.iss || loading.planets || loading.moon || loading.astrocats || loading.solarsystem;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="container mx-auto px-4 py-8">
      <div className="w-full bg-background/80 backdrop-blur-sm border-b py-6 text-center px-4 sm:px-6 lg:px-8">
        <header>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <CalendarDays className="h-10 w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Space Event Calendar</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Discover upcoming celestial events, satellite passes, and planetary alignments.
            {userCoords ? ` Observer: ${userCoords.lat.toFixed(2)}°, ${userCoords.lng.toFixed(2)}°.` :
              loading.initial ? ' Loading location...' : ' Location needed for precise local data.'}
          </p>
          {!userCoords && !loading.initial && (
            <Button 
              onClick={() => window.location.reload()} 
              variant="link" 
              className="text-primary text-sm mt-1"
            >
              <MapPinned className="mr-2 h-4 w-4"/>Enable Location
            </Button>
          )}
        </header>
      </div>

        {/* Centered Calendar at the top */}
        <div className="max-w-md mx-auto mb-8"> {/* Centered container */}
          <Card className="shadow-xl border border-border/50 bg-card/95 backdrop-blur-sm"> {/* Calendar card */}
            <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
                className="rounded-lg border shadow-sm"
                modifiers={{ events: eventDaysOnCalendar }}
                modifiersClassNames={{ 
                  events: "bg-primary/20 text-primary-foreground rounded-full hover:bg-primary/30 transition-colors" 
                }}
                disabled={loading.initial}
                classNames={{
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible"
                }}
            />
        </CardContent>
      </Card>
        </div>

        {/* Events Section below the calendar */}
        <div className="space-y-6"> {/* Container for all event/data cards */}
      {error && (
            <div className="w-full">
              <p className="text-destructive text-center p-4 bg-destructive/10 rounded-lg flex items-center justify-center gap-2 text-sm">
            <AlertTriangle className="h-5 w-5" /> {error}
          </p>
        </div>
      )}

      {selectedDate && (
        <div className="space-y-6 animate-fade-in animation-delay-200">
              <h2 className="text-2xl font-semibold text-foreground text-center border-b pb-3">
                Events for {format(selectedDate, 'MMMM d, yyyy')}
          </h2>

          {isAnyDataLoading && !error && !loading.initial && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3 text-muted-foreground text-lg">Loading events...</p>
            </div>
          )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* All Events Card */}
                <Card className="shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-7 w-7 text-primary" />
                      <CardTitle className="text-xl text-primary">All Events</CardTitle>
                </div>
                    <CardDescription>Combined events from all sources</CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                    <ScrollArea className="h-[400px] pr-4">
                      {eventsForSelectedDate.length > 0 ? (
                        <div className="space-y-4">
                          {eventsForSelectedDate.map((event, index) => (
                            <div key={`event-${index}`} className="p-4 rounded-lg border bg-background/50 hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3 mb-2">
                                <event.icon className="h-5 w-5 text-primary shrink-0" />
                                <h4 className="font-semibold text-foreground">{event.title}</h4>
                                {event.type && (
                                  <Badge variant={event.badgeVariant || 'default'} className="ml-auto shrink-0">
                                    {event.type}
                                  </Badge>
                                )}
                          </div>
                              {event.time && (
                                <p className="text-sm text-muted-foreground mb-1">{event.time}</p>
                              )}
                              {event.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                                  <MapPin className="h-3 w-3" /> {event.location}
                                </p>
                              )}
                              <p className="text-sm text-foreground/80">{event.details}</p>
                              {event.link && (
                                <a
                                  href={event.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                >
                                  More Info <ExternalLink className="h-3 w-3" />
                              </a>
                          )}
                      </div>
                          ))}
                  </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6">
                          No events found for this date
                        </p>
                      )}
                    </ScrollArea>
              </CardContent>
            </Card>

            {/* Planetary Visibility Card */}
                <Card className="shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Telescope className="h-7 w-7 text-primary" />
                  <CardTitle className="text-xl text-primary">Planetary Visibility</CardTitle>
                </div>
                    <CardDescription>Planets visible from your location</CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                    <ScrollArea className="h-[400px] pr-4">
                {loading.planets ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : !userCoords ? (
                        <p className="text-muted-foreground text-center py-6">
                          Enable location for planetary data
                        </p>
                ) : planetaryPositions.length > 0 ? (
                        <div className="space-y-4">
                          {planetaryPositions
                            .filter(p => p.position?.horizonal?.altitude?.degrees && parseFloat(p.position.horizonal.altitude.degrees) > 0)
                            .map((planet) => (
                              <div key={planet.id} className="p-4 rounded-lg border bg-background/50">
                                <h4 className="font-semibold text-foreground mb-2">{planet.name}</h4>
                                <div className="text-sm space-y-1">
                                  <p className="text-muted-foreground">
                                    Altitude: {planet.position?.horizonal?.altitude?.string || 'N/A'}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Azimuth: {planet.position?.horizonal?.azimuth?.string || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          {planetaryPositions.filter(p => p.position?.horizonal?.altitude?.degrees && parseFloat(p.position.horizonal.altitude.degrees) <= 0).length === planetaryPositions.length && (
                            <p className="text-muted-foreground text-center py-6">
                              No major planets currently visible above the horizon
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6">
                          No planetary position data available
                        </p>
                      )}
                  </ScrollArea>
              </CardContent>
            </Card>

            {/* Moon Phase Card */}
                <Card className="shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3"> 
                  <MoonIconLucide className="h-7 w-7 text-primary" />
                  <CardTitle className="text-xl text-primary">Moon Phase</CardTitle>
                </div>
                    <CardDescription>Current moon phase for your location</CardDescription>
              </CardHeader>
                  <CardContent className="pt-2">
                {loading.moon ? (
                      <div className="flex justify-center items-center h-[200px]">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : !userCoords ? (
                      <p className="text-muted-foreground text-center py-6">
                        Enable location for moon phase data
                      </p>
                ) : moonPhase?.imageUrl ? (
                      <div className="text-center">
                        <Image
                          src={moonPhase.imageUrl}
                          alt={`Moon phase: ${moonPhase.phase?.name || 'Unknown'}`}
                          width={120}
                          height={120}
                          className="mx-auto rounded-full shadow-md mb-4 border"
                        />
                        <p className="text-lg font-semibold text-foreground mb-2">
                          {moonPhase.phase?.name || 'Unknown Phase'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Illumination: {moonPhase.illumination !== undefined ? (moonPhase.illumination * 100).toFixed(1) + '%' : 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">
                        Moon phase data not available
                      </p>
                )}
              </CardContent>
            </Card>

                {/* Satellite Passes Card */}
                <Card className="shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
                  <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
                      <Satellite className="h-7 w-7 text-primary" />
                      <CardTitle className="text-xl text-primary">Satellite Passes</CardTitle>
          </div>
                    <CardDescription>Upcoming satellite passes for your location</CardDescription>
        </CardHeader>
                  <CardContent className="pt-2">
                    <ScrollArea className="h-[200px] pr-4">
                      {loading.iss ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : !userCoords ? (
                        <p className="text-muted-foreground text-center py-6">
                          Enable location for satellite pass data
                        </p>
                      ) : eventsForSelectedDate.filter(e => e.source === 'n2yo').length > 0 ? (
                        <div className="space-y-4">
                          {eventsForSelectedDate
                            .filter(e => e.source === 'n2yo')
                            .map((event, index) => (
                              <div key={`satellite-${index}`} className="p-4 rounded-lg border bg-background/50">
                                <h4 className="font-semibold text-foreground mb-2">{event.title}</h4>
                                <p className="text-sm text-muted-foreground mb-1">{event.time}</p>
                                <p className="text-sm text-foreground/80">{event.details}</p>
                  </div>
                ))}
              </div>
          ) : (
                        <p className="text-muted-foreground text-center py-6">
                          No satellite passes scheduled for this date
                        </p>
          )}
                    </ScrollArea>
        </CardContent>
      </Card>
              </div>
            </div>
          )}
        </div>

        <CardFooter className="py-4 border-t">
          <p className="text-center text-muted-foreground text-sm">
            Event data combines static information with live data from N2YO (satellite passes), Astrocats (transient events), AstronomyAPI (planetary positions, moon phase), and Solar System OpenData. For critical observations, always verify with multiple sources.
        </p>
      </CardFooter>
      </div>
    </div>
  );
}

    
    