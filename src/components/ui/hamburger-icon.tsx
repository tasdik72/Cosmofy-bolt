import { cn } from "@/lib/utils"

interface HamburgerIconProps extends React.HTMLAttributes<SVGSVGElement> {
  className?: string
}

export function HamburgerIcon({ className, ...props }: HamburgerIconProps) {
  return (
    <svg
      className={cn("h-12 w-12", className)}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" y1="8" x2="28" y2="8" />
      <line x1="4" y1="16" x2="28" y2="16" />
      <line x1="4" y1="24" x2="28" y2="24" />
    </svg>
  )
}
