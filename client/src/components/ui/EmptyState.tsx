import React from 'react';
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-fade-in ${className}`}>
      <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex flex-col items-center justify-center mb-5 border border-[#E2E8F0]">
        <Icon className="w-8 h-8 text-[#94A3B8]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[16px] font-semibold text-[#1E293B] mb-1.5">{title}</h3>
      <p className="text-[14px] text-[#64748B] max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary shadow-sm hover:shadow-md transition-all">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
