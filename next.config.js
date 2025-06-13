/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com', // Example for potential future image sources
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        port: '',
        pathname: '/img/wn/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.astronomyapi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'widgets.astronomyapi.com', // Added for moon phase images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.astrocats.space',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Environment variables available in both server and client components
  env: {
    // Server-side only variables (not exposed to the browser)
    NASA_API_KEY: process.env.NASA_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    N2YO_API_KEY: process.env.N2YO_API_KEY,
    ASTRONOMY_API_APP_ID: process.env.ASTRONOMY_API_APP_ID,
    ASTRONOMY_API_SECRET: process.env.ASTRONOMY_API_SECRET,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    TIMEZONEDB_API_KEY: process.env.TIMEZONEDB_API_KEY,
    
    // Public variables (exposed to the browser)
    NEXT_PUBLIC_NASA_API_KEY: process.env.NEXT_PUBLIC_NASA_API_KEY,
    NEXT_PUBLIC_OPENWEATHER_API_KEY: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
    NEXT_PUBLIC_TIMEZONEDB_API_KEY: process.env.NEXT_PUBLIC_TIMEZONEDB_API_KEY,
  },
  
  // Ensure environment variables are loaded at build time
  serverRuntimeConfig: {
    // Will only be available on the server side
    nasaApiKey: process.env.NASA_API_KEY,
    openweatherApiKey: process.env.OPENWEATHER_API_KEY,
    timezoneDbApiKey: process.env.TIMEZONEDB_API_KEY,
    astronomyAppId: process.env.ASTRONOMY_API_APP_ID,
    astronomySecret: process.env.ASTRONOMY_API_SECRET,
    n2yoApiKey: process.env.N2YO_API_KEY,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client side (be careful!)
    nasaApiKey: process.env.NEXT_PUBLIC_NASA_API_KEY,
    openweatherApiKey: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
    timezoneDbApiKey: process.env.NEXT_PUBLIC_TIMEZONEDB_API_KEY,
  }
};

module.exports = nextConfig;
