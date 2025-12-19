import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
    const percentage = Math.round(scale * 100);

    return (
        <Card className="absolute top-4 right-4 z-10 flex flex-col gap-1 p-2 shadow-lg">
            <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom avant (Ctrl + Molette haut)" className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="px-2 py-1 text-center text-xs font-medium">{percentage}%</div>

            <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom arrière (Ctrl + Molette bas)" className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
            </Button>

            <div className="my-1 border-t" />

            <Button variant="ghost" size="icon" onClick={onReset} title="Réinitialiser le zoom" className="h-8 w-8">
                <RotateCcw className="h-4 w-4" />
            </Button>
        </Card>
    );
}
