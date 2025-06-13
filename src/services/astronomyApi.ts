
// src/services/astronomyApi.ts
'use server';

const ASTRONOMY_API_BASE_URL = 'https://api.astronomyapi.com/api/v2';
const APP_ID = process.env.ASTRONOMY_API_APP_ID;
const APP_SECRET = process.env.ASTRONOMY_API_SECRET;

function getAuthHeader(): HeadersInit {
  if (!APP_ID || !APP_SECRET) {
    console.error('Astronomy API credentials (APP_ID or APP_SECRET) are not defined in environment variables.');
    throw new Error('Astronomy API credentials are not configured. Please set ASTRONOMY_API_APP_ID and ASTRONOMY_API_SECRET in your .env file.');
  }
  const credentials = `${APP_ID}:${APP_SECRET}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return {
    'Authorization': `Basic ${base64Credentials}`,
  };
}

export interface Observer {
  latitude: number;
  longitude: number;
  date: string; // YYYY-MM-DD
  elevation?: number;
}

export interface StarChartParams {
  style: "default" | "inverted" | "navy" | "red";
  observer: Observer;
  view: {
    type: "constellation" | "area" | "object";
    parameters: any;
  };
  zoom?: number;
}

export interface MoonPhaseParams {
  observer: Observer;
  style: {
    moonStyle: "default" | "sketch" | "realistic";
    backgroundStyle: "stars" | "solid"; // Updated to remove "transparent"
    backgroundColor?: string;
    headingColor?: string;
    textColor?: string;
  };
  view: {
    type: "landscape-simple" | "landscape-beautiful" | "portrait-simple" | "portrait-flipped";
    orientation?: "south-up" | "north-up";
  };
}


async function fetchAstronomyData(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
  const headers = getAuthHeader();
  let url = `${ASTRONOMY_API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
        ...headers, // Auth header
        ...(method === 'POST' && body ? { 'Content-Type': 'application/json' } : {}), // Content-Type for POST
    },
    cache: 'no-store', // For real-time data
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  } else if (method === 'GET' && body) {
    // Filter out undefined or null values before creating URLSearchParams
    const filteredBody: Record<string, string> = {};
    for (const key in body) {
      if (body[key] !== undefined && body[key] !== null) {
        filteredBody[key] = String(body[key]);
      }
    }
    const queryParams = new URLSearchParams(filteredBody).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Astronomy API Error (${response.status}) for ${url}:`, errorBody);
      try {
        const jsonError = JSON.parse(errorBody);
        if (jsonError && jsonError.error?.message) { 
          throw new Error(`Failed to fetch Astronomy data from ${endpoint}: ${jsonError.error.message}`);
        } else if (jsonError && jsonError.message) {
          throw new Error(`Failed to fetch Astronomy data from ${endpoint}: ${jsonError.message}`);
        } else if (jsonError && jsonError.errors && jsonError.errors.length > 0 && jsonError.errors[0].message) {
           throw new Error(`Failed to fetch Astronomy data from ${endpoint}: ${jsonError.errors[0].message}`);
        }
      } catch (parseErr) {
        // Fallback to statusText or raw body if error is not JSON or structure is unexpected
      }
      throw new Error(`Failed to fetch Astronomy data for ${endpoint}: ${response.statusText || errorBody}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const jsonResponse = await response.json();
        // Specific check for image URL generation endpoints
        if ((endpoint.includes('/studio/star-chart') || endpoint.includes('/studio/moon-phase')) && jsonResponse.data && jsonResponse.data.imageUrl) {
            return jsonResponse;
        }
        return jsonResponse;
    } else {
        // Handle non-JSON responses gracefully, e.g. if an image is returned directly (though API docs suggest JSON for imageUrl)
        console.warn(`Received non-JSON response from Astronomy API endpoint ${endpoint}. Content-Type: ${contentType}`);
        return response.text(); // Or handle as blob/arrayBuffer if it's an image
    }

  } catch (error) {
    console.error(`Error processing data from Astronomy API (${url}):`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while fetching or processing Astronomy data.');
  }
}

export async function getStarChart(params: StarChartParams) {
  return fetchAstronomyData('/studio/star-chart', 'POST', params);
}

export interface PlanetaryPositionsParams {
  latitude: number;
  longitude: number;
  from_date: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
  time?: string;      // HH:MM:SS
  elevation?: number;
}
export async function getPlanetaryPositions(observer: PlanetaryPositionsParams) {
  // Ensure time is always provided, defaulting to current UTC time if not specified
  const currentTimeUTC = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });

  const apiParams: {
    latitude: number;
    longitude: number;
    from_date: string;
    to_date: string;
    elevation: number;
    time: string; 
  } = {
    latitude: observer.latitude,
    longitude: observer.longitude,
    from_date: observer.from_date,
    to_date: observer.to_date || observer.from_date,
    elevation: observer.elevation || 0,
    time: observer.time || currentTimeUTC,
  };

  return fetchAstronomyData('/bodies/positions', 'GET', apiParams);
}

export async function getMoonPhase(params: MoonPhaseParams) {
  return fetchAstronomyData('/studio/moon-phase', 'POST', params);
}

export async function searchCelestialObject(term: string) {
  return fetchAstronomyData('/search', 'GET', { term });
}

export async function getCelestialBodiesInfo() {
  return fetchAstronomyData('/bodies', 'GET');
}
