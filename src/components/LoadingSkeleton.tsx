export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-list" aria-label="กำลังโหลด">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton" key={index} />
      ))}
    </div>
  );
}
