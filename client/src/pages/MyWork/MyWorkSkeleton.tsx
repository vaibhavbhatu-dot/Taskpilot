export function MyWorkSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 h-[52px] px-4 ${i > 0 ? 'border-t border-[#F1F5F9]' : ''} ${i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
        >
          <div className="w-2 h-2 rounded-full bg-[#E2E8F0] animate-pulse" />
          <div className="h-3.5 w-14 bg-[#E2E8F0] rounded animate-pulse" />
          <div className="h-3.5 w-48 bg-[#E2E8F0] rounded animate-pulse" />
          <div className="flex-1" />
          <div className="h-5 w-20 bg-[#E2E8F0] rounded animate-pulse" />
          <div className="h-3.5 w-16 bg-[#E2E8F0] rounded animate-pulse" />
          <div className="h-3.5 w-12 bg-[#E2E8F0] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
