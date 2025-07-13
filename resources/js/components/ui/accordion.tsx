import * as React from 'react';
import {
  Accordion as RadixAccordion,
  AccordionItem as RadixAccordionItem,
  AccordionTrigger as RadixAccordionTrigger,
  AccordionContent as RadixAccordionContent,
} from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils'; 

const Accordion = React.forwardRef<
  React.ElementRef<typeof RadixAccordion>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion>
>(({ className, ...props }, ref) => (
  <RadixAccordion
    ref={ref}
    className={cn('w-full rounded-md bg-white shadow-sm', className)}
    {...props}
  />
));
Accordion.displayName = 'Accordion';

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof RadixAccordionItem>,
  React.ComponentPropsWithoutRef<typeof RadixAccordionItem>
>(({ className, ...props }, ref) => (
  <RadixAccordionItem
    ref={ref}
    className={cn('border-b border-gray-200 last:border-b-0', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof RadixAccordionTrigger>,
  React.ComponentPropsWithoutRef<typeof RadixAccordionTrigger>
>(({ className, children, ...props }, ref) => (
  <RadixAccordionTrigger
    ref={ref}
    className={cn(
      'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg:rotate-180',
      className
    )}
    {...props}
  >
    {children}
    <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200" />
  </RadixAccordionTrigger>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof RadixAccordionContent>,
  React.ComponentPropsWithoutRef<typeof RadixAccordionContent>
>(({ className, children, ...props }, ref) => (
  <RadixAccordionContent
    ref={ref}
    className={cn(
      'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </RadixAccordionContent>
));
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };