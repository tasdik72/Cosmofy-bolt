// src/services/astrocatsApi.ts
'use server';

const ASTROCATS_API_BASE_URL = 'https://api.astrocats.space';

interface AstrocatsEvent {
  name: string;
  // Add other relevant fields based on the API response you want to use
  // For example: ra, dec, discoverdate, claimedtype, catalog, schema, sources, etc.
  [key: string]: any; // Allow other properties
}

async function fetchAstrocatsData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  // Filter out undefined or null values from params
  const filteredParams: Record<string, string> = {};
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      filteredParams[key] = String(params[key]);
    }
  }
  const queryParams = new URLSearchParams(filteredParams).toString();
  const url = `${ASTROCATS_API_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Astrocats API Error (${response.status}) for ${url}:`, errorBody);
      throw new Error(`Failed to fetch Astrocats data for ${endpoint}: ${response.status} ${errorBody}`);
    }
    const data = await response.json();
    // The API returns an object where keys are event names, and values are event data arrays
    // We need to transform this into a simple array of events
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).flat(); // Flatten the array of arrays if events have multiple entries
    }
    return []; // Return empty array if structure is not as expected
  } catch (error) {
    console.error(`Error fetching data from Astrocats API (${url}):`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while fetching Astrocats data.');
  }
}

export interface SearchEventsByDateParams {
  discoverdate: string; // YYYY-MM-DD
  ra?: string;
  dec?: string;
  radius?: string; // in arcseconds
  name?: string;
  claimedtype?: string;
  format?: 'json' | 'csv' | 'tsv' | 'html';
  // Add other search parameters as needed from https://github.com/astrocatalogs/OACAPI
}

export async function searchAstrocatsEvents(params: SearchEventsByDateParams): Promise<AstrocatsEvent[]> {
  // Construct the path, as search parameters are part of the path before the query string for some OAC endpoints
  // For a general search by date, the endpoint structure is simpler with query params
  // Example: /search?discoverdate=YYYY-MM-DD&format=json
  // However, the API example /<catalog_name>/?date=YYYY-MM-DD suggests different structures too.
  // Using the /search endpoint as it seems most flexible for date-based queries.
  // Let's refine the endpoint to be /search?name=&discoverdate={YYYY-MM-DD}&format=json as per initial request
  
  const searchParams: Record<string, string> = {
    format: params.format || 'json',
    discoverdate: params.discoverdate,
  };
  if (params.name) searchParams.name = params.name;
  if (params.claimedtype) searchParams.claimedtype = params.claimedtype;
  // Add other params if necessary

  return fetchAstrocatsData('/all', searchParams); // OACAPI /all returns all events, filter by date query param
}
