import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40 focus-visible:ring-cyan-500 border border-cyan-500/30',
      secondary:
        'bg-surface-elevated hover:bg-surface-muted text-slate-100 border border-surface-border focus-visible:ring-slate-400',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 focus-visible:ring-rose-500 border border-rose-500/30',
      outline:
        'bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700 focus-visible:ring-slate-400',
      ghost:
        'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white focus-visible:ring-slate-400',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8',
      md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10',
      lg: 'text-base px-6 py-2.5 rounded-xl gap-2.5 h-12 font-semibold',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
