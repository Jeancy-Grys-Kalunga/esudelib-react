import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Component, Database, Layers, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CodeViewer } from './components/CodeViewer';
import { DiagramToolbar } from './components/DiagramToolbar';
import { DiagramViewer } from './components/DiagramViewer';
import { StatisticsCard } from './components/StatisticsCard';
import { TableExplorer } from './components/TableExplorer';
import { useDiagram } from './hooks/useDiagram';

interface DatabaseSchema {
    tables: Array<{
        name: string;
        module: string;
        columns: Array<{
            name: string;
            type: string;
            nullable?: boolean;
            unique?: boolean;
        }>;
        foreignKeys: Array<{
            column: string;
            referencedTable: string;
            referencedColumn: string;
        }>;
    }>;
    relations: Array<{
        from: string;
        to: string;
        type: string;
    }>;
    modules: Array<{
        name: string;
        tables: string[];
        tableCount: number;
    }>;
}

interface Statistics {
    totalTables: number;
    totalRelations: number;
    totalModules: number;
}

interface Props {
    databaseSchema: DatabaseSchema;
    statistics: Statistics;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'UML Viewer', href: '/uml-viewer' },
];

const diagramTypes = [
    {
        id: 'class',
        name: 'Diagramme de Classes',
        description: 'Toutes les tables avec leurs relations',
        icon: Database,
    },
    {
        id: 'deployment',
        name: 'Diagramme de Déploiement',
        description: 'Architecture Docker Swarm',
        icon: Layers,
    },
    {
        id: 'packaging',
        name: 'Diagramme de Packaging',
        description: 'Organisation en couches et modules',
        icon: Package,
    },
    {
        id: 'component',
        name: 'Diagramme de Composants',
        description: 'Composants techniques et interfaces',
        icon: Component,
    },
];

export default function UmlViewerIndex({ databaseSchema, statistics }: Props) {
    const [activeTab, setActiveTab] = useState('class');
    const [showCode, setShowCode] = useState(false);
    const [showTableExplorer, setShowTableExplorer] = useState(false);

    const { diagram, imageUrl, loading, error, generateDiagram, exportDiagram } = useDiagram();

    // Générer le diagramme initial
    useEffect(() => {
        generateDiagram(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleExport = async (format: 'png' | 'svg' | 'puml') => {
        if (!diagram) return;
        await exportDiagram(activeTab, format, diagram);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="UML Viewer" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header avec statistiques */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatisticsCard title="Tables" value={statistics.totalTables} description="Tables dans la base de données" icon={Database} />
                    <StatisticsCard title="Relations" value={statistics.totalRelations} description="Relations entre tables" icon={Layers} />
                    <StatisticsCard title="Modules" value={statistics.totalModules} description="Modules métier" icon={Package} />
                </div>

                {/* Contenu principal */}
                <Card className="flex-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Visualiseur de Diagrammes UML</CardTitle>
                                <CardDescription>Explorez l'architecture de votre application</CardDescription>
                            </div>
                            <DiagramToolbar
                                onExport={handleExport}
                                onToggleCode={() => setShowCode(!showCode)}
                                onToggleExplorer={() => setShowTableExplorer(!showTableExplorer)}
                                showCode={showCode}
                                showExplorer={showTableExplorer}
                                loading={loading}
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                {diagramTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <TabsTrigger key={type.id} value={type.id}>
                                            <Icon className="mr-2 h-4 w-4" />
                                            {type.name}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {diagramTypes.map((type) => (
                                <TabsContent key={type.id} value={type.id} className="mt-4">
                                    <div className="space-y-4">
                                        {/* Description */}
                                        <div className="bg-muted/50 rounded-lg border p-4">
                                            <p className="text-muted-foreground text-sm">{type.description}</p>
                                        </div>

                                        {/* Layout avec explorateur optionnel */}
                                        <div className="grid gap-4 lg:grid-cols-12">
                                            {/* Explorateur de tables (optionnel) */}
                                            {showTableExplorer && (
                                                <div className="lg:col-span-3">
                                                    <TableExplorer tables={databaseSchema.tables} modules={databaseSchema.modules} />
                                                </div>
                                            )}

                                            {/* Visualiseur de diagramme */}
                                            <div className={showTableExplorer ? 'lg:col-span-9' : 'lg:col-span-12'}>
                                                <DiagramViewer plantUML={diagram} imageUrl={imageUrl} loading={loading} error={error} />
                                            </div>
                                        </div>

                                        {/* Code PlantUML (optionnel) */}
                                        {showCode && diagram && <CodeViewer code={diagram} />}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
