import { NextResponse } from 'next/server';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  const apiKey = serverRuntimeConfig.timezoneDbApiKey || process.env.TIMEZONEDB_API_KEY;
  
  if (!apiKey) {
    console.error('TimeZoneDB API key is not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${lat}&lng=${lng}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TimeZoneDB API error:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the response data structure
    if (data.status !== 'OK') {
      throw new Error(data.message || 'Invalid response from TimeZoneDB API');
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching timezone data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch timezone data' },
      { status: 500 }
    );
  }
}
