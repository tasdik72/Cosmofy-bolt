
// src/services/timeZoneDbApi.ts
const TIMEZONEDB_API_BASE_URL = 'https://api.timezonedb.com/v2.1';
const API_KEY = process.env.TIMEZONEDB_API_KEY;

interface FetchTimeZoneParams {
  lat: number;
  lng: number; // TimeZoneDB uses 'lng' for longitude
  format?: string;
  by?: string;
}

export async function getTimeZoneData(params: FetchTimeZoneParams): Promise<any> {
  if (!API_KEY) {
    console.error('TimeZoneDB API key is not defined.');
    throw new Error('TimeZoneDB API key is not configured.');
  }

  const queryParams = new URLSearchParams({
    key: API_KEY,
    format: params.format || 'json',
    by: params.by || 'position',
    ...params,
  } as any); // Type assertion as lat/lon are numbers

  const url = `${TIMEZONEDB_API_BASE_URL}/get-time-zone?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
       const errorBody = await response.text();
      console.error(`TimeZoneDB API Error (${response.status}):`, errorBody);
      throw new Error(`Failed to fetch time zone data: ${response.status} ${errorBody}`);
    }
    const data = await response.json();
    if(data.status !== "OK"){
        console.error(`TimeZoneDB API Error (response status ${data.status}):`, data.message);
        throw new Error(`Failed to fetch time zone data: ${data.message}`);
    }
    return data;
  } catch (error) {
    console.error('Error fetching time zone data:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching time zone data.');
  }
}
