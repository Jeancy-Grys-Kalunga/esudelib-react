import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Code, Download, Loader2, Table } from 'lucide-react';

interface DiagramToolbarProps {
    onExport: (format: 'png' | 'svg' | 'puml') => void;
    onToggleCode: () => void;
    onToggleExplorer: () => void;
    showCode: boolean;
    showExplorer: boolean;
    loading?: boolean;
}

export function DiagramToolbar({ onExport, onToggleCode, onToggleExplorer, showCode, showExplorer, loading }: DiagramToolbarProps) {
    return (
        <div className="flex items-center gap-2">
            {/* Bouton Explorateur de tables */}
            <Button variant={showExplorer ? 'default' : 'outline'} size="sm" onClick={onToggleExplorer} disabled={loading}>
                <Table className="mr-2 h-4 w-4" />
                Tables
            </Button>

            {/* Bouton Code PlantUML */}
            <Button variant={showCode ? 'default' : 'outline'} size="sm" onClick={onToggleCode} disabled={loading}>
                <Code className="mr-2 h-4 w-4" />
                Code
            </Button>

            {/* Menu Export */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Exporter
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onExport('png')}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('svg')}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger SVG
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onExport('puml')}>
                        <Code className="mr-2 h-4 w-4" />
                        Télécharger PlantUML
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
