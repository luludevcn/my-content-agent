'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Dialog = ({ open, onClose, children, className }: DialogProps) => {
  if (!open) return null;

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 text-left shadow-2xl',
          'transform transition-all duration-200',
          'animate-in fade-in zoom-in-95',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
Dialog.displayName = 'Dialog';

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2', className)}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-4', className)} {...props} />
));
DialogContent.displayName = 'DialogContent';

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-end space-x-2 mt-6', className)}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
