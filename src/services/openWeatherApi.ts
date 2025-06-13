
// src/services/openWeatherApi.ts
const OPENWEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.OPENWEATHER_API_KEY;

interface FetchWeatherParams {
  lat: number;
  lon: number;
  units?: string;
}

export async function getCurrentWeather(params: FetchWeatherParams): Promise<any> {
  if (!API_KEY) {
    console.error('OpenWeather API key is not defined.');
    throw new Error('OpenWeather API key is not configured.');
  }

  const queryParams = new URLSearchParams({
    ...params,
    appid: API_KEY,
    units: params.units || 'metric', // Default to metric units
  } as any); // Type assertion as lat/lon are numbers

  const url = `${OPENWEATHER_API_BASE_URL}/weather?${queryParams.toString()}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenWeather API Error (${response.status}):`, errorBody);
      throw new Error(`Failed to fetch weather data: ${response.status} ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching current weather:', error);
     if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching weather data.');
  }
}
