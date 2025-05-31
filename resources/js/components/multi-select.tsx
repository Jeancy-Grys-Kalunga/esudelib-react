import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    className,
}: {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);

    const filteredOptions = useMemo(() => {
        return options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    const toggleOption = (value: string) => {
        const newValue = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
        onChange(newValue);
    };

    const removeOption = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((v) => v !== value));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-12 w-full justify-between rounded-lg px-3 py-2 transition-all',
                        'hover:border-primary focus:ring-primary/50 focus:ring-2',
                        'border border-gray-200 dark:border-gray-700',
                        className,
                    )}
                >
                    <div className="flex flex-wrap gap-2 overflow-hidden">
                        {selected.length > 0 ? (
                            options
                                .filter((o) => selected.includes(o.value))
                                .map((o) => (
                                    <Badge key={o.value} variant="secondary" className="flex items-center gap-1 rounded-full pr-1.5">
                                        {o.label}
                                        <button
                                            type="button"
                                            onClick={(e) => removeOption(o.value, e)}
                                            className="rounded-full p-0.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-muted-foreground truncate">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 opacity-70" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="bg-background z-50 w-[400px] rounded-lg border p-0 shadow-lg" align="start">
                <div className="bg-background sticky top-0 border-b p-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search options..."
                            className="w-full pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 p-3 transition-colors',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    selected.includes(option.value) && 'bg-accent/50',
                                )}
                                onClick={() => toggleOption(option.value)}
                            >
                                <div
                                    className={cn(
                                        'flex h-5 w-5 items-center justify-center rounded border',
                                        selected.includes(option.value)
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-gray-300 dark:border-gray-600',
                                    )}
                                >
                                    {selected.includes(option.value) && <Check className="h-4 w-4" />}
                                </div>
                                <span className="flex-1">{option.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-muted-foreground p-4 text-center">No options found</div>
                    )}
                </div>

                {selected.length > 0 && (
                    <div className="bg-background sticky bottom-0 flex items-center justify-between border-t p-2">
                        <span className="text-muted-foreground text-sm">{selected.length} selected</span>
                        <button type="button" onClick={() => onChange([])} className="text-primary text-sm hover:underline">
                            Clear all
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
