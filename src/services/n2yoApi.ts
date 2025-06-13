
// src/services/n2yoApi.ts
'use server';

const N2YO_API_BASE_URL = 'https://api.n2yo.com/rest/v1/satellite';
const API_KEY = process.env.N2YO_API_KEY;

interface N2YOBaseParams {
  apiKey?: string; // Will be added automatically
}

export interface SatellitePositionParams extends N2YOBaseParams {
  observer_lat: number;
  observer_lng: number;
  observer_alt: number;
  seconds: number; // Number of positions to return
}

export interface VisualPassesParams extends N2YOBaseParams {
  observer_lat: number;
  observer_lng: number;
  observer_alt: number;
  days: number;
  min_visibility: number; // Minimum duration of pass in seconds
}

export interface AboveParams extends N2YOBaseParams {
  observer_lat: number;
  observer_lng: number;
  observer_alt: number;
  search_radius: number; // Search radius in degrees
  category_id: number;   // e.g., 0 for all, 1 for Brightest, 2 for ISS etc.
}

export interface RadioPassesParams extends N2YOBaseParams {
  observer_lat: number;
  observer_lng: number;
  observer_alt: number;
  days: number;
  min_elevation: number; // Minimum elevation in degrees
}


async function fetchN2YOData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  if (!API_KEY) {
    console.error('N2YO_API_KEY is not defined in environment variables.');
    throw new Error('N2YO API Key is not configured. Please set N2YO_API_KEY in your .env file.');
  }

  // Remove apiKey from params if it was accidentally passed, as it's added below
  const { apiKey, ...restParams } = params;
  
  const queryParams = new URLSearchParams({ ...restParams, apiKey: API_KEY });
  const url = `${N2YO_API_BASE_URL}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); // 'no-store' for real-time data
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`N2YO API Error (${response.status}) for ${url}:`, errorBody);
      throw new Error(`Failed to fetch N2YO data for ${endpoint}: ${response.status} ${errorBody}`);
    }
    const data = await response.json();
    // N2YO API returns error messages within the 'info' object
    if (data.info && data.info.error) {
        console.error(`N2YO API Info Error for ${url}:`, data.info.error);
        throw new Error(`N2YO API Error: ${data.info.error}`);
    }
    if (data.info && data.info.transactionscount === 0) {
      // This might indicate an issue or just no data for the request
      console.warn(`N2YO API: Transaction count is 0 for ${url}. This might indicate no data or an issue.`);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching data from N2YO API (${url}):`, error);
    if (error instanceof Error) {
      throw error; // Re-throw known errors
    }
    throw new Error('An unknown error occurred while fetching N2YO data.'); // Generic fallback
  }
}

// Note: N2YO API constructs URLs like /positions/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}
// The parameters in the function signature are for clarity and type safety, then used to construct the path.

export async function getSatellitePositions(noradId: number, params: SatellitePositionParams) {
  const endpoint = `/positions/${noradId}/${params.observer_lat}/${params.observer_lng}/${params.observer_alt}/${params.seconds}`;
  return fetchN2YOData(endpoint, {}); // Other params like apiKey are handled by fetchN2YOData
}

export async function getVisualPasses(noradId: number, params: VisualPassesParams) {
  const endpoint = `/visualpasses/${noradId}/${params.observer_lat}/${params.observer_lng}/${params.observer_alt}/${params.days}/${params.min_visibility}`;
  return fetchN2YOData(endpoint, {});
}

export async function getSatellitesAbove(params: AboveParams) {
  const endpoint = `/above/${params.observer_lat}/${params.observer_lng}/${params.observer_alt}/${params.search_radius}/${params.category_id}`;
  return fetchN2YOData(endpoint, {});
}

export async function getTLE(noradId: number) {
  const endpoint = `/tle/${noradId}`;
  return fetchN2YOData(endpoint, {});
}

export async function getRadioPasses(noradId: number, params: RadioPassesParams) {
  const endpoint = `/radiopasses/${noradId}/${params.observer_lat}/${params.observer_lng}/${params.observer_alt}/${params.days}/${params.min_elevation}`;
  return fetchN2YOData(endpoint, {});
}
