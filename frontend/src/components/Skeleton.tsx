import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      {...props}
    />
  );
};

export interface SkeletonCardProps {
  showActions?: boolean;
  showImage?: boolean;
  imageHeight?: string;
  paragraphCount?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showActions = true,
  showImage = false,
  imageHeight = 'h-48',
  paragraphCount = 2
}) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      {showImage && (
        <Skeleton className={`${imageHeight} w-full mb-4`} />
      )}
      <Skeleton className="h-6 w-3/4 mb-4" />
      {Array.from({ length: paragraphCount }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full mb-2" />
      ))}
      {showActions && (
        <div className="flex space-x-2 mt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      )}
    </div>
  );
};