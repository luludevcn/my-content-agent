import { cn } from '@/lib/utils';
import * as React from 'react';

const Dialog = React.forwardRef<
  HTMLDialogElement,
  React.DialogHTMLAttributes<HTMLDialogElement>
>(({ className, ...props }, ref) => (
  <dialog
    ref={ref}
    className={cn(
      'relative z-50 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-left shadow-2xl',
      className
    )}
    {...props}
  />
));
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
