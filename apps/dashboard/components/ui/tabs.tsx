'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Tabs = ({ defaultValue, value: controlledValue, onValueChange, children }: TabsProps) => {
  const [value, setValue] = React.useState(defaultValue || '');
  const currentValue = controlledValue ?? value;

  const handleChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setValue(newValue);
    }
  };

  const triggerChildren: React.ReactNode[] = [];
  const contentChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const type = (child as React.ReactElement).type;
      if (type === TabsList || type === TabsTrigger) {
        triggerChildren.push(child);
      } else if (type === TabsContent) {
        contentChildren.push(child);
      }
    }
  });

  return (
    <div className="space-y-2">
      {React.Children.map(triggerChildren, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, { value: currentValue, onValueChange: handleChange })
          : child
      )}
      {contentChildren}
    </div>
  );
};
Tabs.displayName = 'Tabs';

interface TabsListProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const TabsList = ({ value, onValueChange, children, className }: TabsListProps) => {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-sm font-medium',
        className
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, { value, onValueChange })
          : child
      )}
    </div>
  );
};
TabsList.displayName = 'TabsList';

interface TabsTriggerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const TabsTrigger = ({ value, onValueChange, children, className }: TabsTriggerProps) => {
  const triggerValue = (children as React.ReactElement)?.props?.value || '';
  const isActive = value === triggerValue;

  return (
    <button
      onClick={() => onValueChange?.(triggerValue)}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700',
        className
      )}
    >
      {children}
    </button>
  );
};
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps {
  value?: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContent = ({ value, children, className }: TabsContentProps) => {
  const contentValue = (children as React.ReactElement)?.props?.value || '';
  const isActive = value === contentValue;

  return (
    <div
      className={cn(
        'mt-2',
        isActive ? 'block' : 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
};
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
