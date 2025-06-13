
"use client";

import { useState, useEffect } from 'react';
import { Clock, MapPin, Sun, Cloud, AlertTriangle, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ThemeToggleSwitch } from '@/components/ui/theme-toggle-switch';

interface WeatherData {
  description: string;
  icon: string;
  temp: number;
  city: string;
}

interface TimeZoneData {
  formattedTime: string;
  abbreviation: string;
}

export function GlobalInfoHeader() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>('Getting location...');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [timeZoneInfo, setTimeZoneInfo] = useState<TimeZoneData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{latitude: number, longitude: number} | null>(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Geolocation not supported');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocation(`Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`);
        setError(null);
      },
      () => {
        setLocation('Location permission denied');
        setError('Unable to retrieve your location. Please enable location services.');
      }
    );
  };

  useEffect(() => {
    fetchLocation(); // Attempt to get location on mount
    
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!coords) return;
    
    // Fetch Weather
    fetch(`/api/weather?lat=${coords.latitude}&lng=${coords.longitude}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch weather data');
        }
        return res.json();
      })
      .then(data => {
        if (data.weather && data.main) {
          setWeather({
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            temp: data.main.temp,
            city: data.name,
          });
          setLocation(data.name); // Update location with city name
        } else {
          throw new Error('Invalid weather data structure');
        }
      })
      .catch(error => {
        console.error('Error fetching weather data:', error);
        setWeather(null);
        setError(prev => prev ? `${prev} Weather data unavailable.` : 'Weather data unavailable.');
      });

    // Fetch Timezone
    fetch(`/api/timezone?lat=${coords.latitude}&lng=${coords.longitude}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch timezone data');
        }
        return res.json();
      })
      .then(data => {
        if (data.status === "OK") {
          setTimeZoneInfo({
            formattedTime: new Date(data.formatted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            abbreviation: data.abbreviation,
          });
        } else {
          throw new Error(data.message || 'Failed to fetch timezone data');
        }
      })
      .catch(error => {
        console.error("Failed to fetch timezone data:", error);
        setTimeZoneInfo(null);
        setError(prev => prev ? `${prev} Timezone data unavailable.` : 'Timezone data unavailable.');
      });
  }, [coords]);

  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1"></div>
    );
  }

  return (
    <div className="flex items-center justify-end w-full gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base text-foreground/80">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {timeZoneInfo ? `${timeZoneInfo.formattedTime} ${timeZoneInfo.abbreviation}` : (currentTime ?? 'Loading...')}
            </span>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate max-w-[120px] lg:max-w-none">{location}</span>
            {!coords && location === 'Location permission denied' && (
              <Button 
                onClick={fetchLocation} 
                variant="ghost" 
                size="sm" 
                className="ml-0.5 p-1.5 h-auto text-accent hover:text-accent/80"
              >
                <LocateFixed className="h-4 w-4 sm:h-5 sm:w-5"/>
                <span className="sr-only">Retry Location</span>
              </Button>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          {weather ? (
            <>
              <Image 
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                alt={weather.description} 
                width={32}
                height={32}
                className="h-6 w-6 sm:h-7 sm:w-7"
              />
              <span className="font-medium">{Math.round(weather.temp)}°C</span>
              <span className="hidden lg:inline text-foreground/80 capitalize ml-1">
                {weather.description}
              </span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Weather N/A</span>
            </>
          )}
        </div>
        
        {error && (
          <div className="hidden lg:flex items-center gap-1.5 text-destructive" title={error}>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5"/>
          </div>
        )}
      </div>
      <div className="scale-110 sm:scale-100">
        <ThemeToggleSwitch />
      </div>
    </div>
  );
}
