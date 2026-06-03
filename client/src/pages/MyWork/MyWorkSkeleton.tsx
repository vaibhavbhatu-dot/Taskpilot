export function MyWorkSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[12px] overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 h-[52px] px-4 ${i > 0 ? 'border-t border-muted' : ''} ${i % 2 === 1 ? 'bg-muted/30' : 'bg-card'}`}
        >
          <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
          <div className="h-3.5 w-14 bg-muted rounded animate-pulse" />
          <div className="h-3.5 w-48 bg-muted rounded animate-pulse" />
          <div className="flex-1" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          <div className="h-3.5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3.5 w-12 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
