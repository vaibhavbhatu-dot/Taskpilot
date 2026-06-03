import { cn } from "@/lib/utils"

// ── Base ──────────────────────────────────────────────────────────────────────

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "circle" | "line"
}

function Skeleton({ className, variant = "rectangle", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variant === "circle"    && "rounded-full",
        variant === "line"      && "rounded-md h-4",
        variant === "rectangle" && "rounded-md",
        className
      )}
      {...props}
    />
  )
}

// ── Compositions ──────────────────────────────────────────────────────────────

function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Skeleton variant="line" className="w-full" />
      <Skeleton variant="line" className="w-[80%]" />
      <Skeleton variant="line" className="w-[60%]" />
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="line" className="w-1/2" />
          <Skeleton variant="line" className="w-1/3 h-3" />
        </div>
      </div>
      <SkeletonText />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  )
}

const AVATAR_SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const

function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: keyof typeof AVATAR_SIZES
  className?: string
}) {
  return (
    <Skeleton
      variant="circle"
      className={cn(AVATAR_SIZES[size], className)}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar }
