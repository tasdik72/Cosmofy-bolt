"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Zap, Orbit, Rocket, CalendarDays, AlertTriangle as AlertTriangleLucideIcon, Sun, Globe } from "lucide-react"; // Added Sun, Globe
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";


const features = [
  {
    title: "Space Weather Center",
    slug: "space-weather",
    description: "Solar flares, CMEs, geomagnetic storms, and more.",
    icon: Zap,
    image: "/img/dashboard/space-weather-bg.png",
    aiHint: "solar activity",
    details: [
      { label: "Solar Activity", value: "Live Updates", icon: Sun }, 
      { label: "Earth Impact", value: "Current Status", icon: Orbit },
    ]
  },
  {
    title: "Space Disaster",
    slug: "space-disaster",
    description: "Monitor NEOs, storms, and critical alerts.",
    icon: AlertTriangleLucideIcon, // Using the aliased version
    image: "/img/dashboard/space-disaster-bg.png", // You provided a URL for this one earlier
    aiHint: "asteroid danger",
    details: [
      { label: "Threats", value: "NEOs & Storms", icon: AlertTriangleLucideIcon },
      { label: "Alerts", value: "Stay Informed", icon: Globe },
    ]
  },
  {
    title: "Spacecraft Tracking",
    slug: "spacecraft-tracking",
    description: "Follow active space missions with real-time data.",
    icon: Rocket,
    image: "/img/dashboard/spacecraft-tracking-bg.png",
    aiHint: "satellite orbit",
    details: [
      { label: "Missions", value: "Real-Time Data", icon: Rocket },
      { label: "Orbital Info", value: "TLE & Passes", icon: Globe }, 
    ]
  },
  {
    title: "Personalized Event Calendar",
    slug: "event-calendar",
    description: "Discover launches, meteor showers, and celestial events.",
    icon: CalendarDays,
    image: "/img/dashboard/event-calendar-bg.png",
    aiHint: "meteor shower",
    details: [
      { label: "Sky Events", value: "Personalized View", icon: CalendarDays },
      { label: "Visibility", value: "Local Timings", icon: Globe },
    ]
  },
  {
    title: "Interactive Solar System",
    slug: "solar-system",
    description: "Explore planets, moons, and celestial body positions.",
    icon: Orbit,
    image: "/img/dashboard/solar-system-bg.png",
    aiHint: "solar system",
    details: [
      { label: "Planets", value: "Current Positions", icon: Orbit },
      { label: "Exploration", value: "Interactive Data", icon: Globe },
    ]
  },
  // Ask AI card removed
];

// Order remains the same as per previous request without dashboard, and AI explainer was at the end.
// Since AI is now a global widget, it's removed from here.
const orderedFeatures = [
  features.find(f => f.title === "Space Weather Center"),
  features.find(f => f.title === "Space Disaster"),
  features.find(f => f.title === "Spacecraft Tracking"),
  features.find(f => f.title === "Personalized Event Calendar"),
  features.find(f => f.title === "Interactive Solar System"),
].filter(Boolean) as typeof features;


export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 bg-background">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-in">
          Welcome to <span className="text-primary">Cosmofy</span>
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground sm:text-xl animate-fade-in animation-delay-200">
          Your portal to the cosmos. Explore, learn, and stay informed.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {orderedFeatures.map((feature, index) => (
          <Link key={feature.slug} href={feature.slug} passHref legacyBehavior>
            <a className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Card
                className={cn(
                  "overflow-hidden shadow-lg h-full flex flex-col animate-fade-in bg-card border border-border transition-all duration-300 ease-in-out",
                  "group-hover:shadow-xl group-hover:border-primary"
                )}
                style={{ animationDelay: `${index * 100 + 300}ms` }}
              >
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={cn(
                        "object-cover transition-transform duration-500 ease-in-out group-hover:scale-105",
                         feature.title === "Space Disaster" && feature.image.startsWith("https://firestuff.page.link") ? "" : "" // No blur if it's the specific disaster image link
                      )}
                      data-ai-hint={feature.aiHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <feature.icon className="h-8 w-8 text-primary mb-1.5" />
                      <CardTitle className="text-xl font-semibold text-white group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-between bg-card">
                  <div>
                    <CardDescription className="text-muted-foreground mb-3 text-sm">{feature.description}</CardDescription>
                    {feature.details && feature.details.length > 0 && (
                      <ul className="space-y-1.5 text-base">
                        {feature.details.map(detail => (
                          <li key={detail.label} className="flex items-center">
                            <detail.icon className="h-4 w-4 mr-2 text-primary/80" />
                            <span className="font-medium text-foreground/90">{detail.label}:</span>
                            <span className="ml-1 text-muted-foreground">{detail.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-4 text-right">
                    <span className="text-xs text-primary group-hover:underline">Explore &rarr;</span>
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
