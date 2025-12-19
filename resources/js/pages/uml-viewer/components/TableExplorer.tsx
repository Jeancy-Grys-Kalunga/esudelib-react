import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Database, Search, Table as TableIcon } from 'lucide-react';
import { useState } from 'react';

interface Table {
    name: string;
    module: string;
    columns: Array<{
        name: string;
        type: string;
    }>;
}

interface Module {
    name: string;
    tables: string[];
    tableCount: number;
}

interface TableExplorerProps {
    tables: Table[];
    modules: Module[];
}

export function TableExplorer({ tables, modules }: TableExplorerProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredModules = modules
        .map((module) => ({
            ...module,
            tables: tables.filter(
                (table) => table.module === module.name && (searchQuery === '' || table.name.toLowerCase().includes(searchQuery.toLowerCase())),
            ),
        }))
        .filter((module) => module.tables.length > 0);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Database className="h-4 w-4" />
                    Explorateur de Tables
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                        placeholder="Rechercher une table..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {/* Liste des modules et tables */}
                <div className="h-[500px] overflow-auto">
                    <Accordion type="multiple" className="w-full">
                        {filteredModules.map((module) => (
                            <AccordionItem key={module.name} value={module.name}>
                                <AccordionTrigger className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>{module.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {module.tables.length}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pl-4">
                                        {module.tables.map((table) => (
                                            <div
                                                key={table.name}
                                                className="group hover:bg-accent cursor-pointer rounded-md border p-2 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <TableIcon className="text-muted-foreground h-3 w-3" />
                                                    <span className="text-sm font-medium">{table.name}</span>
                                                </div>
                                                <div className="text-muted-foreground mt-1 text-xs">{table.columns.length} colonnes</div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {/* Statistiques */}
                <div className="text-muted-foreground border-t pt-3 text-xs">
                    <div className="flex justify-between">
                        <span>Total tables :</span>
                        <span className="font-medium">{tables.length}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                        <span>Modules :</span>
                        <span className="font-medium">{modules.length}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
