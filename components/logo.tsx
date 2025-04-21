import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-green-500 blur-sm"></div>
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white">
        <span className="font-bold">AI</span>
      </div>
    </div>
  )
}
