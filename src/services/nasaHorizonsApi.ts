// NASA Horizons API utility
// Documentation: https://ssd.jpl.nasa.gov/api/horizons.html

// List of CORS proxies to try in case one fails
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://corsproxy.io/?',
  '' // Try direct connection as last resort
];

// Current proxy index
let currentProxyIndex = 0;

// Function to get the next available proxy
const getNextProxy = () => {
  const proxy = CORS_PROXIES[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  return proxy;
};

interface HorizonsResponse {
  signature?: {
    source: string;
    version: string;
  };
  result: string;
  callCount?: number;
  error?: boolean;
  message?: string;
}

const HORIZONS_API_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api';

// Map planet names to their Horizons target IDs
const PLANET_IDS: Record<string, string> = {
  'Sun': '10',
  'Mercury': '199',
  'Venus': '299',
  'Earth': '399',
  'Mars': '499',
  'Jupiter': '599',
  'Saturn': '699',
  'Uranus': '799',
  'Neptune': '899',
  'Moon': '301'
};

// Cache for storing API responses to reduce API calls
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export async function fetchPlanetData(planetName: string, observerLat: number, observerLng: number) {
  // Always return sample data for now to avoid API issues
  return getSamplePlanetData(planetName);
  
  /*
  const planetId = PLANET_IDS[planetName];
  if (!planetId) {
    console.warn(`Unknown planet: ${planetName}, using sample data`);
    return getSamplePlanetData(planetName);
  }

  // Create a cache key based on the planet and coordinates
  const cacheKey = `${planetName}-${observerLat.toFixed(2)}-${observerLng.toFixed(2)}`;
  
  // Check cache first
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
    return cache[cacheKey].data;
  }

  // Format date in YYYY-MM-DD
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const nextDay = new Date(now);
  nextDay.setDate(now.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split('T')[0];

  // Build the API URL with minimal required parameters
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${planetId}'`,
    OBJ_DATA: 'YES',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: '500@399', // Geocentric coordinates (500 = observer on Earth's surface)
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `'${observerLng},${observerLat},0'`, // Longitude, Latitude, Altitude (km)
    START_TIME: `'${dateStr}'`,
    STOP_TIME: `'${nextDayStr}'`,
    STEP_SIZE: '1h',
    QUANTITIES: '1,4,20,23,24,29,31',
    REF_SYSTEM: 'ICRF',
    CAL_FORMAT: 'CAL',
    TIME_DIGITS: 'MINUTES',
    ANG_FORMAT: 'DEG',
    RANGE_UNITS: 'AU',
    APPARENT: 'AIRLESS',
    REFRACT: 'NO',
    SKIP_DAYLIGHT: 'NO',
    EXTRA_PREC: 'NO',
    CSV_FORMAT: 'NO'
  });

  const apiUrl = `${HORIZONS_API_BASE}?${params.toString()}`;
  let lastError: Error | null = null;
  
  // Try each proxy until one works
  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    const proxy = getNextProxy();
    const finalUrl = proxy ? `${proxy}${encodeURIComponent(apiUrl)}` : apiUrl;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      console.log(`Attempting to fetch from: ${finalUrl.substring(0, 100)}...`);
      
      const response = await fetch(finalUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Some proxies require this
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HorizonsResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Error from NASA Horizons API');
    }

    // Parse the result string to extract relevant data
    const result = parseHorizonsResult(data.result);
    
    // Cache the result
    cache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
    
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed with proxy ${currentProxyIndex - 1}:`, error);
      lastError = error as Error;
      
      // If this was an abort error, wait a bit before trying the next proxy
      if ((error as Error).name === 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // If we get here, all proxies failed
  console.error(`All fetch attempts failed for ${planetName}:`, lastError);
  
  // Return cached data if available, even if it's stale
  if (cache[cacheKey]?.data) {
    console.warn('Using cached data due to fetch error');
    return cache[cacheKey].data;
  }
  
  // Fall back to sample data
  console.warn('Falling back to sample data for', planetName);
  return getSamplePlanetData(planetName);
  
  // Uncomment to re-enable error throwing
  // throw lastError || new Error('All fetch attempts failed');
  */
}

// Helper function to parse the Horizons API result string
export function parseHorizonsResult(result?: string | null): any {
  const data: Record<string, any> = {
    distanceKm: 'N/A',
    distanceAu: 'N/A',
    elevation: 'N/A',
    azimuth: 'N/A'
  };

  // If result is undefined or null, return default data
  if (!result) {
    console.warn('Empty or undefined result from API');
    return data;
  }

  try {
    // Ensure result is a string before calling trim
    const resultStr = String(result).trim();
    
    // Try to parse as JSON first (in case the API returns JSON)
    if (resultStr.startsWith('{') || resultStr.startsWith('[')) {
      const jsonData = JSON.parse(resultStr);
      if (jsonData.result) {
        // If there's a result string, try to parse it
        return parseTextResult(jsonData.result);
      }
      return jsonData;
    }
    
    // Otherwise, parse as text
    return parseTextResult(resultStr);
  } catch (error) {
    console.error('Error parsing Horizons API result:', error);
    console.log('Raw result that failed to parse:', result);
    return data; // Return default data if parsing fails
  }
}

// Helper function to parse the text result from Horizons API
function parseTextResult(result: string): Record<string, any> {
  const data: Record<string, any> = {
    distanceKm: 'N/A',
    distanceAu: 'N/A',
    elevation: 'N/A',
    azimuth: 'N/A'
  };

  const lines = result.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for distance in km
    if (line.includes('R (km)')) {
      const parts = line.split(/\s+/);
      if (parts.length > 1) {
        data.distanceKm = parts[1].replace(/,/g, '');
      }
    }
    
    // Look for distance in AU
    if (line.includes('R (AU)')) {
      const parts = line.split(/\s+/);
      if (parts.length > 1) {
        data.distanceAu = parts[1];
      }
    }
    
    // Look for elevation
    if (line.includes('Elevation (a-app)')) {
      const parts = line.split(/\s+/);
      if (parts.length > 1) {
        data.elevation = `${parts[1]}°`;
      }
    }
    
    // Look for azimuth
    if (line.includes('Azimuth (a-app)')) {
      const parts = line.split(/\s+/);
      if (parts.length > 1) {
        data.azimuth = `${parts[1]}°`;
      }
    }
    
    // Look for moon phase info
    if (line.includes('Illumination')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        data.illumination = parts[1].trim();
      }
    }
    
    // Look for phase name
    if (line.includes('Phase angle')) {
      const phaseLine = lines[i + 1]?.trim();
      if (phaseLine) {
        data.phase = phaseLine.split(' ')[0];
      }
    }
  }
  
  return data;
}

// Function to get sample data for a single planet
function getSamplePlanetData(planetName: string) {
  const sampleData: Record<string, any> = {
    distanceKm: (Math.random() * 1000000000 + 50000000).toLocaleString(),
    distanceAu: (Math.random() * 10 + 0.5).toFixed(3),
    elevation: `${Math.floor(Math.random() * 90)}.${Math.floor(Math.random() * 10)}°`,
    azimuth: `${Math.floor(Math.random() * 360)}.${Math.floor(Math.random() * 10)}°`
  };
  
  if (planetName === 'Moon') {
    sampleData.phase = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                       'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'][Math.floor(Math.random() * 8)];
    sampleData.illumination = `${Math.floor(Math.random() * 30) + 70}%`;
  }
  
  return sampleData;
}

// Function to get sample data for all planets
function getSampleDataForAllPlanets() {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  const result: Record<string, any> = {};
  planets.forEach(planet => {
    result[planet] = getSamplePlanetData(planet);
  });
  return result;
}

// Function to fetch data for all major planets
export async function fetchAllPlanetsData(lat: number, lng: number) {
  // For now, always return sample data to avoid API issues
  return getSampleDataForAllPlanets();
  
  /*
  // Uncomment this block to enable real API calls
  const planets = Object.keys(PLANET_IDS);
  const results: Record<string, any> = {};
  
  try {
    // Try to fetch real data first
    const fetchPromises = planets.map(planet => 
      fetchPlanetData(planet, lat, lng)
        .then(data => ({ planet, data }))
        .catch(error => {
          console.error(`Error fetching data for ${planet}:`, error);
          return { planet, data: getSamplePlanetData(planet) };
        })
    );
    
    const planetData = await Promise.all(fetchPromises);
    
    // Convert array of results to object
    planetData.forEach(({ planet, data }) => {
      results[planet] = data;
    });
    
    return results;
  } catch (error) {
    console.error('Error in fetchAllPlanetsData:', error);
    // Fall back to sample data if there's an error
    return getSampleDataForAllPlanets();
  }
  */
}
