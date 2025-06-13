"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react'; // Added useState, useEffect
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter
} from '@/components/ui/sidebar';
import { CosmofyLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  PanelLeft,
  X,
  Rocket,
  CalendarDays,
  Zap,
  AlertTriangle as SpaceDisasterIcon,
  Gift,
  Orbit,
  LayoutDashboard,
  Bot, // Added Bot icon
  MessageCircle, // Added for FAB
  X as CloseIcon // Added for FAB close state
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlobalInfoHeader } from './global-info-header';
import { GlobalAIChatWidget } from '@/components/ai/GlobalAIChatWidget'; // New Import
import { HamburgerIcon } from '@/components/ui/hamburger-icon';
import { SpeedInsights } from '@vercel/speed-insights/next';

const donateNavItem = { href: '/donate', label: 'Donate', icon: Gift }; // Define donate item separately

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/space-weather', label: 'Space Weather', icon: Zap },
  { href: '/space-disaster', label: 'Space Disaster', icon: SpaceDisasterIcon },
  { href: '/spacecraft-tracking', label: 'Spacecraft Tracking', icon: Rocket },
  { href: '/event-calendar', label: 'Event Calendar', icon: CalendarDays },
  { href: '/solar-system', label: 'Solar System', icon: Orbit },
]; // Removed Donate from here

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);

  const mainNavItems = navItems; // Now includes all items except donate
  // const bottomNavItems = navItems.filter(item => item.isBottom); // No bottom items for now

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar 
          side="left" 
          variant="sidebar" 
          collapsible="icon" 
          className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2 group">
              <CosmofyLogo size="md" className="text-primary transition-transform group-hover:rotate-[15deg] duration-300 group-data-[collapsible=icon]:hidden" />
              <h1 className="text-3xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                Cosmofy
              </h1>
            </Link>
          </SidebarHeader>

          <SidebarContent className="flex-1 px-2 py-0 flex flex-col justify-between">
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      variant="default"
                      size="default"
                      className={cn(
                        "justify-start w-full",
                        isActive ? "bg-sidebar-primary" : "hover:bg-sidebar-accent"
                      )}
                      tooltip={{children: item.label, side: "right", align: "center"}}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                         <item.icon className={cn(
                           "h-5 w-5 shrink-0 text-sidebar-foreground", 
                           isActive ? "text-sidebar-primary-foreground" : "group-hover/menu-item:text-sidebar-accent-foreground"
                         )} />
                        <span className={cn(
                          "group-data-[collapsible=icon]:hidden",
                           isActive ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground",
                           "group-hover/menu-item:text-sidebar-accent-foreground"
                        )}>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            
            {/* Removed bottomNavItems section */}
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border group-data-[collapsible=icon]:border-none flex flex-col items-center gap-2">
             {/* Donate Button at the bottom */}
             <SidebarMenuItem key={donateNavItem.label} className="w-full">
                <SidebarMenuButton
                  asChild
                  isActive={pathname === donateNavItem.href}
                  variant="default"
                  size="default"
                  className={cn(
                    "justify-start w-full",
                    pathname === donateNavItem.href ? "bg-sidebar-primary" : "hover:bg-sidebar-accent"
                  )}
                   tooltip={{children: donateNavItem.label, side: "right", align: "center"}}
                >
                  <Link href={donateNavItem.href} className="flex items-center gap-3">
                     <donateNavItem.icon className={cn(
                       "h-5 w-5 shrink-0 text-sidebar-foreground", 
                       pathname === donateNavItem.href ? "text-sidebar-primary-foreground" : "group-hover/menu-item:text-sidebar-accent-foreground"
                     )} />
                    <span className={cn(
                      "group-data-[collapsible=icon]:hidden",
                       pathname === donateNavItem.href ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground",
                       "group-hover/menu-item:text-sidebar-accent-foreground"
                    )}>{donateNavItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            <div className="group-data-[collapsible=icon]:hidden text-xs text-sidebar-foreground/70 flex flex-col sm:flex-row sm:items-center sm:justify-center text-center gap-x-2 w-full">
              <span> {children} </span>
              <Link href="/privacy-policy" className="text-primary hover:underline underline-offset-2">
                Privacy Policy
              </Link>
              <SpeedInsights />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className={cn(
            "flex-1 flex flex-col min-w-0", 
            "md:pl-[var(--sidebar-width-icon)] group-data-[state=expanded]:md:pl-[var(--sidebar-width)] transition-[padding-left] duration-300 ease-in-out" // Re-added transition for smoother sidebar expand/collapse
          )}
        >
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-sm w-full px-2 sm:px-4">
            <SidebarTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-24 w-24"
                aria-label="Toggle menu"
              >
                <HamburgerIcon className="h-12 w-12"/>
              </Button>
            </SidebarTrigger>
            <div className="flex-1 flex justify-end pr-2 sm:pr-4 lg:pr-6">
              <GlobalInfoHeader />
            </div>
          </header>
          <main className="flex-1 bg-background overflow-y-auto relative"> {/* Removed padding from main */}
            {/* Conditionally render Donate page header outside padding */}
            {pathname === '/donate' && (
              <div className="w-full bg-background/80 backdrop-blur-sm border-b py-6 text-center"> {/* Full width header area for donate */}
                <div className="flex items-center justify-center space-x-3 mb-2 px-4 sm:px-6 lg:px-8">
                  <Gift className="h-10 w-10 text-primary" />
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Support Cosmofy</h1>
                </div>
                <p className="text-lg text-muted-foreground px-4 sm:px-6 lg:px-8">
                  Help us keep the universe within reach!
                </p>
              </div>
            )}

            <div className="px-4 sm:px-6 lg:px-8 py-6"> {/* Added padding to a new wrapper div */}
              {/* Render children (page content) - Donate page will exclude its header */}
              {pathname !== '/donate' ? children : (
                 // If it's the donate page, render only the content below the header
                 // We assume the donate page component is structured to have its content below a top-level header div
                 // A better approach would be to structure the Donate page component
                 // to export its content separately.
                 // For now, let's assume the children is the DonatePage component instance
                 // and we need to pass a prop or context to tell it not to render its header.
                 // Since we can't easily modify the children prop's component rendering here,
                 // let's assume the DonatePage component will handle not rendering its header
                 // based on some external state or prop if needed, or we will modify it next.

                 // Simplification: Just render the children as is, but the DonatePage component
                 // will be modified next to remove its header.
                 React.Children.map(children, child => {
                   if (React.isValidElement(child) && typeof child.type === 'function') {
                     // Assuming the default export is the main component
                     // We need a way to render only the content part of the Donate page
                     // A better approach would be to structure the Donate page component
                     // to export its content separately.
                     // For now, let's assume the children is the DonatePage component instance
                     // and we need to pass a prop or context to tell it not to render its header.
                     // Since we can't easily modify the children prop's component rendering here,
                     // let's assume the DonatePage component will handle not rendering its header
                     // based on some external state or prop if needed, or we will modify it next.

                     // Simplification: Just render the children as is, but the DonatePage component
                     // will be modified next to remove its header.
                     return children;
                   }
                   return child;
                 })
              )}
            </div>
            
            {/* Vercel Speed Insights */}
            <SpeedInsights />
            
            {/* AI Chat Widget and FAB */}
            <GlobalAIChatWidget isOpen={isChatWidgetOpen} onClose={() => setIsChatWidgetOpen(false)} />
            
            <Button
              variant="default"
              size="icon"
              className="fixed bottom-6 right-4 sm:right-6 md:right-8 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90"
              onClick={() => setIsChatWidgetOpen(!isChatWidgetOpen)}
              aria-label={isChatWidgetOpen ? "Close AI Chat" : "Open AI Chat"}
            >
              {isChatWidgetOpen ? <CloseIcon className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
            </Button>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
