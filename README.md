# Cosmofy - Your Universe, Unveiled

A comprehensive space exploration platform that brings the cosmos to your fingertips. Explore real-time space weather, track spacecraft, discover celestial events, and get AI-powered explanations of cosmic phenomena.

## 🛠️ Tech Stack

### Core Technologies
- **Next.js 15** (App Router) - React framework for server-rendered applications
- **React 18** - Frontend library for building user interfaces
- **TypeScript** - Type-safe JavaScript for better developer experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **React Three Fiber** - 3D visualization library for the solar system
- **TanStack Query** - Data fetching and state management

### UI Components & Libraries
- **ShadCN/UI** - Accessible, customizable components built on Radix UI
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide Icons** - Beautiful, consistent icons
- **date-fns** - Modern date utility library

### AI Integration
- **OpenRouter** - AI model orchestration
- **DeepSeek Chat** - Primary LLM for space-related Q&A
- **Genkit** - Lightweight abstraction layer for AI flows

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- API keys for the following services:
  - NASA API
  - N2YO API
  - OpenWeather API
  - TimeZoneDB API
  - Astronomy API
  - OpenRouter API (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cosmofy-fire.git
   cd cosmofy-fire
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your API keys:
   ```env
   # Base URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # NASA API
   NASA_API_KEY=your_nasa_api_key
   NEXT_PUBLIC_NASA_API_KEY=your_nasa_api_key

   # OpenRouter API (for AI features)
   OPENROUTER_API_KEY=your_openrouter_api_key

   # N2YO API (for satellite tracking)
   N2YO_API_KEY=your_n2yo_api_key

   # Astronomy API
   ASTRONOMY_API_APP_ID=your_astronomy_app_id
   ASTRONOMY_API_SECRET=your_astronomy_secret

   # OpenWeather API
   OPENWEATHER_API_KEY=your_openweather_api_key
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key

   # TimeZoneDB API
   TIMEZONEDB_API_KEY=your_timezonedb_api_key
   NEXT_PUBLIC_TIMEZONEDB_API_KEY=your_timezonedb_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The application will be available at `http://localhost:3000`

## 🔑 API Configuration

This application uses several third-party APIs. You'll need to obtain API keys for each service and add them to your `.env` file.

### AI Implementation

The application uses OpenRouter with the DeepSeek Chat model for AI-powered explanations. The implementation includes:

- **OpenRouter API**: Handles model orchestration and API calls
- **DeepSeek Chat**: Primary LLM for space-related Q&A
- **Genkit**: Lightweight abstraction layer for AI flows (minimal usage)

The AI assistant (Cosmo) provides information about space phenomena and the Cosmofy platform.

### .env Template

Create a `.env` file in your project root with the following template:

```env
# Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:9002

# NASA API
NASA_API_KEY=your_nasa_api_key_here
NEXT_PUBLIC_NASA_API_KEY=your_nasa_api_key_here

# OpenRouter API (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# N2YO API (for satellite tracking)
N2YO_API_KEY=your_n2yo_api_key_here

# Astronomy API
ASTRONOMY_API_APP_ID=your_astronomy_app_id_here
ASTRONOMY_API_SECRET=your_astronomy_secret_here

# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_api_key_here
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here

# TimeZoneDB API
TIMEZONEDB_API_KEY=your_timezonedb_api_key_here
NEXT_PUBLIC_TIMEZONEDB_API_KEY=your_timezonedb_api_key_here
```

### API Usage Notes

1. **Environment Variables**:
   - Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
   - Sensitive keys should only be used in server-side code
   - Never commit your `.env` file to version control
   - Use different API keys for development and production
   - Consider using environment-specific .env files (e.g., `.env.development`, `.env.production`)

## 🌐 Key Features

### 1. Space Weather Center
- Real-time solar activity monitoring
- Solar flares and coronal mass ejections (CMEs) tracking
- Geomagnetic storm alerts

### 2. Space Disaster Monitoring
- Near-Earth Objects (NEOs) tracking
- Potential impact assessments
- Space weather alerts

### 3. Spacecraft Tracking
- Real-time satellite tracking
- International Space Station (ISS) location
- Upcoming satellite passes

### 4. Event Calendar
- Astronomical events tracking
- Meteor showers
- Planetary alignments
- Rocket launches

### 5. Interactive Solar System
- 3D visualization of the solar system
- Real-time planetary positions
- Celestial body information

## 🌐 API Integrations

### 1. NASA API
- **Purpose**: Space weather data, asteroid information, and space imagery
- **Endpoints Used**:
  - DONKI (Space Weather Database Of Notifications, Knowledge, Information)
  - NEO (Near Earth Objects)
  - APOD (Astronomy Picture of the Day)

### 2. N2YO API
- **Purpose**: Satellite tracking and orbital data
- **Endpoints Used**:
  - Satellite positions
  - Visual passes
  - TLE (Two-Line Element) data

### 3. OpenWeather API
- **Purpose**: Weather conditions for ground-based observations
- **Endpoints Used**:
  - Current weather
  - Weather alerts

### 4. TimeZoneDB API
- **Purpose**: Timezone information for accurate event timing

### 5. AstroCats API
- **Purpose**: Astronomical catalog data
- **Endpoints Used**:
  - Supernova data
  - Gamma-ray bursts

## 📁 Project Structure

```
cosmofy/
├── public/                 # Static files
│   └── img/                # Images and assets
│       ├── dashboard/      # Dashboard background images
│       └── logo/           # Application logos and icons
│
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/           # API routes
│   │   ├── components/     # Reusable components
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
│   │       ├── donate/
│   │       ├── event-calendar/
│   │       ├── privacy-policy/
│   │       ├── solar-system/
│   │       ├── space-disaster/
│   │       ├── spacecraft-tracking/
│   │       └── space-weather/
│   │
│   ├── services/          # API service integrations
│   │   ├── astrocatsApi.ts
│   │   ├── astronomyApi.ts
│   │   ├── n2yoApi.ts
│   │   ├── nasaApi.ts
│   │   ├── nasaHorizonsApi.ts
│   │   ├── openWeatherApi.ts
│   │   └── timeZoneDbApi.ts
│   │
│   └── styles/           # Global styles
│
├── .env.local            # Environment variables (not versioned)
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🙏 Acknowledgments

This project was made possible thanks to the following resources and communities:

### Data Providers
- **NASA** - For their comprehensive space data and imagery through their open APIs
- **N2YO** - For satellite tracking and orbital data
- **OpenWeather** - For terrestrial weather data integration
- **TimeZoneDB** - For accurate timezone information
- **Astronomy API** - For astronomical data and calculations
- **OpenRouter** - For AI model orchestration and access to DeepSeek Chat

### Open Source Technologies
- **Next.js & React** - For the core web application framework
- **TypeScript** - For type-safe development
- **Tailwind CSS** - For modern, responsive styling
- **React Three Fiber** - For 3D solar system visualization
- **ShadCN/UI & Radix UI** - For accessible UI components
- **TanStack Query** - For efficient data fetching and state management
- **date-fns** - For date and time manipulation
- **Lucide Icons** - For beautiful, consistent icons

Special thanks to all the open-source maintainers and contributors whose work has been instrumental in bringing this project to life.
