'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggleSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-14 rounded-full bg-muted" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-foreground/70" />
      <div 
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`
          relative h-5 w-10 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out
          ${isDark ? 'bg-blue-500' : 'bg-gray-300'}
          flex items-center
        `}
      >
        <div 
          className={`
            h-4 w-4 rounded-full bg-white shadow-sm
            transform transition-transform duration-200 ease-in-out
            ${isDark ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      <Moon className="h-4 w-4 text-foreground/70" />
    </div>
  );
}
