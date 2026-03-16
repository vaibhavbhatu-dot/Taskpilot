import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClass = "animate-pulse bg-[#E2E8F0]";
  let variantClass = '';

  switch (variant) {
    case 'circular':
      variantClass = 'rounded-full';
      break;
    case 'text':
      variantClass = 'rounded-md h-4 w-full';
      break;
    case 'rectangular':
    default:
      variantClass = 'rounded-xl';
      break;
  }

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} />
  );
}
