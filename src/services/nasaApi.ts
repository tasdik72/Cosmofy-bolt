
// src/services/nasaApi.ts
'use server'; // For potential use in Server Components or Server Actions if keys are not public

const NASA_API_BASE_URL = 'https://api.nasa.gov';

// Using non-prefixed API key for server-side only usage
const API_KEY = process.env.NASA_API_KEY;

export type NasaDonkiApiEndpoint = 
  | 'CME' 
  | 'FLR' 
  | 'SEP' 
  | 'MPC' 
  | 'RBE' 
  | 'IPS' 
  | 'GST' 
  | 'NEO' // Special case: /neo/rest/v1/feed
  | 'HSS' 
  | 'notifications';

interface FetchDonkiParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  type?: string;       // For notifications: ALL, CME, GST, etc.
  // Add other specific params as needed for different endpoints
}

export async function fetchDonkiData(
  endpointType: NasaDonkiApiEndpoint,
  params: FetchDonkiParams = {}
): Promise<any> {
  if (!API_KEY) {
    throw new Error('NASA_API_KEY is not defined in environment variables.');
  }

  let url: string;
  const queryParams = new URLSearchParams({ ...params, api_key: API_KEY });

  if (endpointType === 'NEO') {
    // NEO endpoint has a different base path and requires start_date & end_date
    if (!params.start_date || !params.end_date) {
      throw new Error('start_date and end_date are required for NEO endpoint.');
    }
    url = `${NASA_API_BASE_URL}/neo/rest/v1/feed?${queryParams.toString()}`;
  } else {
    url = `${NASA_API_BASE_URL}/DONKI/${endpointType}?${queryParams.toString()}`;
  }
  
  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching for real-time data
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`NASA API Error (${response.status}) for ${endpointType}:`, errorBody);
      throw new Error(`Failed to fetch ${endpointType} data: ${response.status} ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from NASA DONKI API (${endpointType}):`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching NASA DONKI data.');
  }
}

// Example usage for fetching Coronal Mass Ejections (CMEs)
export async function getCMEs(startDate?: string, endDate?: string) {
  return fetchDonkiData('CME', { start_date: startDate, end_date: endDate });
}

// Example usage for fetching Solar Flares (FLR)
export async function getSolarFlares(startDate?: string, endDate?: string) {
  return fetchDonkiData('FLR', { start_date: startDate, end_date: endDate });
}
