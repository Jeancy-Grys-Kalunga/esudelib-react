import axios from 'axios';
import { useCallback, useState } from 'react';

interface UseDiagramReturn {
    diagram: string | null;
    imageUrl: string | null;
    loading: boolean;
    error: string | null;
    generateDiagram: (type: string, options?: Record<string, unknown>) => Promise<void>;
    exportDiagram: (type: string, format: 'png' | 'svg' | 'puml', plantUML: string) => Promise<void>;
}

export function useDiagram(): UseDiagramReturn {
    const [diagram, setDiagram] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateDiagram = useCallback(async (type: string, options: Record<string, unknown> = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/uml-viewer/generate', {
                type,
                options,
            });

            if (response.data.success) {
                setDiagram(response.data.plantUML);
                setImageUrl(response.data.imageUrl || null);
            } else {
                setError('Erreur lors de la génération du diagramme');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const exportDiagram = useCallback(
        async (type: string, format: 'png' | 'svg' | 'puml', plantUML: string) => {
            try {
                const response = await axios.post(
                    '/uml-viewer/export',
                    {
                        type,
                        format,
                        plantUML,
                    },
                    {
                        // Always expect a blob, backend now proxies the file
                        responseType: 'blob',
                    },
                );

                // Create a generic download link
                const blob = new Blob([response.data], {
                    type: format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : 'text/plain',
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `diagram_${type}_${Date.now()}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'export";
                console.error('Error exporting diagram:', err);
                setError(errorMessage);
            }
        },
        [setError],
    );

    return {
        diagram,
        imageUrl,
        loading,
        error,
        generateDiagram,
        exportDiagram,
    };
}
