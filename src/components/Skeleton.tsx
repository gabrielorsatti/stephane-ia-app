interface Props {
  className?: string;
}

export function Skeleton({ className = "h-4 w-full" }: Props) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-5/6" />
      <Skeleton className="h-8 w-2/3" />
    </div>
  );
}
