import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ExternalLink, Loader2, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import plantumlEncoder from 'plantuml-encoder';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomControls } from '../components/ZoomControls';
import { usePan } from '../hooks/usePan';
import { useZoom } from '../hooks/useZoom';

interface DiagramViewerProps {
    plantUML: string | null;
    imageUrl: string | null;
    loading?: boolean;
    error?: string | null;
}

export function DiagramViewer({ imageUrl: imageUrlProp, plantUML, loading, error }: DiagramViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [usingFallback, setUsingFallback] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { scale, zoomIn, zoomOut, resetZoom } = useZoom();
    const { position, isDragging, handleMouseDown } = usePan();

    // Generic fallback function
    const generateFallback = useCallback(() => {
        if (plantUML) {
            // Allow retrying even if used before
            try {
                setImageLoading(true);
                setUsingFallback(true);
                const encoded = plantumlEncoder.encode(plantUML);
                console.log('Generating fallback for PlantUML length:', plantUML.length);
                // Use PNG for compatibility with downloads
                const fallbackUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
                setImageUrl(fallbackUrl);
                setLoadError(false);
            } catch (err) {
                console.error("Erreur lors de l'encodage PlantUML:", err);
                setImageLoading(false);
                setLoadError(true);
            }
        }
    }, [plantUML]);

    // Utiliser l'URL du backend au lieu d'encoder côté frontend
    useEffect(() => {
        if (!imageUrlProp) {
            // Si pas d'URL backend, on tente tout de suite le fallback si possible
            if (plantUML) {
                generateFallback();
            } else {
                setImageUrl(null);
            }
            return;
        }

        setImageLoading(true);
        setLoadError(false);
        setUsingFallback(false);
        setImageUrl(imageUrlProp);
    }, [imageUrlProp, plantUML, generateFallback]);

    const handleImageLoad = () => {
        setImageLoading(false);
        setLoadError(false);
    };

    const handleImageError = () => {
        console.warn("Erreur de chargement de l'image (URL: " + imageUrl?.substring(0, 50) + '...). Tentative de fallback...');

        // Detailed error logging
        if (loading) {
            // If we were already loading, stop.
            setImageLoading(false);
        }

        // Si l'image backend échoue, on tente le fallback local
        if (!usingFallback && plantUML) {
            generateFallback();
        } else {
            console.error('Echec du fallback également. PlantUML source:', plantUML?.substring(0, 100) + '...');
            setImageLoading(false);
            setLoadError(true);
        }
    };

    const handleRetry = () => {
        if (plantUML) {
            // Force re-generation
            generateFallback();
        }
    };

    // Toggle fullscreen mode
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => !prev);
    }, []);

    // Gestion de la touche Escape pour quitter le plein écran
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isFullscreen]);

    // Gestion du zoom avec Ctrl + Molette
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [zoomIn, zoomOut]);

    if (loading) {
        return (
            <Card className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground text-sm">Génération du diagramme...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (loadError) {
        return (
            <Card className="bg-muted/10 relative flex min-h-[600px] items-center justify-center overflow-hidden">
                <div className="flex max-w-md flex-col items-center gap-4 p-6 text-center">
                    <AlertCircle className="text-destructive h-10 w-10" />
                    <h3 className="text-lg font-semibold">Impossible d'afficher le diagramme</h3>
                    <p className="text-muted-foreground text-sm">L'image n'a pas pu être chargée. Cela peut être dû à une taille trop importante.</p>
                    <div className="mt-2 flex gap-2">
                        <Button variant="outline" onClick={handleRetry}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Réessayer
                        </Button>
                        {plantUML && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const encoded = plantumlEncoder.encode(plantUML);
                                    window.open(`https://www.plantuml.com/plantuml/uml/${encoded}`, '_blank');
                                }}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ouvrir dans PlantUML
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        );
    }

    if (!imageUrl && !plantUML) {
        return (
            <Card className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
                <p className="text-muted-foreground text-sm">Aucun diagramme à afficher</p>
            </Card>
        );
    }

    return (
        <>
            <Card className="relative overflow-hidden">
                {/* Contrôles de zoom */}
                <ZoomControls scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />

                {/* Bouton plein écran */}
                <div className="absolute top-4 right-4 z-20">
                    <Button variant="outline" size="sm" onClick={toggleFullscreen} className="bg-white/90 backdrop-blur-sm">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Conteneur du diagramme */}
                <div
                    ref={containerRef}
                    className="relative max-h-[800px] min-h-[600px] cursor-grab overflow-auto bg-white/50 active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                >
                    {/* Loading skeleton */}
                    {imageLoading && (
                        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                <p className="text-muted-foreground text-xs">Chargement de l'image...</p>
                            </div>
                        </div>
                    )}

                    {/* Image du diagramme */}
                    {(imageUrl || plantUML) && imageUrl && (
                        <div
                            className="inline-block min-w-full p-8 transition-transform duration-200"
                            style={{
                                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                                transformOrigin: 'top left',
                            }}
                        >
                            <img
                                src={imageUrl}
                                alt="Diagramme UML"
                                className="mx-auto rounded-lg shadow-sm"
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                draggable={false}
                            />
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-muted/50 flex items-center justify-between border-t px-4 py-2">
                    <p className="text-muted-foreground text-xs">
                        💡 <strong>Astuce :</strong> Utilisez Ctrl + Molette pour zoomer, ou glissez-déposez pour naviguer
                    </p>
                    {usingFallback && (
                        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                            Mode Fallback (Client)
                        </span>
                    )}
                </div>
            </Card>

            {/* Mode plein écran */}
            {isFullscreen && imageUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
                    {/* Bouton fermer */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm"
                    >
                        <Minimize2 className="mr-2 h-4 w-4" />
                        Quitter (Esc)
                    </Button>

                    {/* Contrôles de zoom en plein écran */}
                    <div className="absolute top-4 left-4 z-50">
                        <ZoomControls scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
                    </div>

                    {/* Image en plein écran */}
                    <div
                        className="h-full w-full cursor-grab overflow-auto active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        style={{
                            cursor: isDragging ? 'grabbing' : 'grab',
                        }}
                    >
                        <div
                            className="inline-block min-h-full min-w-full p-8 transition-transform duration-200"
                            style={{
                                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                                transformOrigin: 'center',
                            }}
                        >
                            <img src={imageUrl} alt="Diagramme UML" className="mx-auto max-h-screen w-auto rounded-lg shadow-2xl" draggable={false} />
                        </div>
                    </div>

                    {/* Instructions en plein écran */}
                    <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-white/90 px-4 py-2 backdrop-blur-sm">
                        <p className="text-xs font-medium text-gray-700">
                            💡 Ctrl + Molette pour zoomer • Glisser-déposer pour naviguer • Esc pour quitter
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
