import axios from 'axios';
import { useCallback, useState } from 'react';

interface UseDiagramReturn {
    diagram: string | null;
    imageUrl: string | null;
    sql: string | null;
    loading: boolean;
    error: string | null;
    generateDiagram: (type: string, options?: Record<string, unknown>) => Promise<void>;
    exportDiagram: (type: string, format: 'png' | 'svg' | 'puml', plantUML: string) => Promise<void>;
}

export function useDiagram(): UseDiagramReturn {
    const [diagram, setDiagram] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [sql, setSql] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateDiagram = useCallback(async (type: string, options: Record<string, unknown> = {}) => {
        setLoading(true);
        setError(null);
        // Reset previous data
        setDiagram(null);
        setImageUrl(null);
        setSql(null);

        try {
            const response = await axios.post('/uml-viewer/generate', {
                type,
                options,
            });

            if (response.data.success) {
                // Check if it's a SQL response
                if (response.data.isSql) {
                    setSql(response.data.sql);
                } else {
                    setDiagram(response.data.plantUML);
                    setImageUrl(response.data.imageUrl || null);
                }
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
                console.log(`Exporting diagram: type=${type}, format=${format}, plantUML length=${plantUML.length}`);

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

                console.log('Export response received:', response.status, response.headers['content-type']);

                // Check if we got an error JSON instead of a blob
                if (response.headers['content-type']?.includes('application/json')) {
                    const text = await response.data.text();
                    const error = JSON.parse(text);
                    throw new Error(error.message || "Erreur lors de l'export");
                }

                // Create a generic download link
                const blob = new Blob([response.data], {
                    type: format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : 'text/plain',
                });

                console.log('Blob created:', blob.size, 'bytes');

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `diagram_${type}_${Date.now()}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                console.log('Download triggered successfully');
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'export";
                console.error('Error exporting diagram:', err);
                setError(errorMessage);

                // Show user-friendly error
                alert(`Erreur lors du téléchargement: ${errorMessage}`);
            }
        },
        [setError],
    );

    return {
        diagram,
        imageUrl,
        sql,
        loading,
        error,
        generateDiagram,
        exportDiagram,
    };
}
