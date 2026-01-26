import React from 'react';
import { cn } from '../../utils/cn';

export function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-emerald-500/30 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      {...props}
    />
  );
}

