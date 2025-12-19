import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col', className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childProps = child.props as { value?: string };
            const childType = child.type as any;
            
            // Heuristic: If child has a value prop, it's likely TabsContent (identifying itself).
            if (childProps.value !== undefined) {
               return React.cloneElement(child, { 
                   active: childProps.value === value 
               } as { active: boolean });
            }
            
            // Only pass onValueChange to TabsList
            if (childType.displayName === 'TabsList') {
                return React.cloneElement(child, { value, onValueChange } as { value: string; onValueChange: (value: string) => void });
            }
          }
          return child;
        })}
      </div>
    );
  }
);
Tabs.displayName = 'Tabs';

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, value, onValueChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
          'overflow-x-auto whitespace-nowrap',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { 
              onValueChange, 
            
              active: 
            //@ts-expect-error: value property check on generic child props
              child.props.value === value 
            } as { onValueChange?: (value: string) => void; active: boolean });
          }
          return child;
        })}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  active?: boolean;
  onValueChange?: (value: string) => void;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, active, onValueChange, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background',
        'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        active 
          ? 'bg-background text-foreground shadow-sm' 
          : 'hover:bg-gray-100',
        className
      )}
      onClick={() => onValueChange && onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  active?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, active, ...props }, ref) => (
    <div
      ref={ref}
      data-state={active ? 'active' : 'inactive'}
      data-value={value}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active ? 'block' : 'hidden',
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };