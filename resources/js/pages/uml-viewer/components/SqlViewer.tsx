import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Copy, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SqlViewerProps {
    sql: string | null;
    type: 'mysql' | 'postgresql';
    loading?: boolean;
    error?: string | null;
}

export function SqlViewer({ sql, type, loading, error }: SqlViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!sql) return;

        try {
            await navigator.clipboard.writeText(sql);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        if (!sql) return;

        const filename = `database_${type}_${Date.now()}.sql`;
        const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Card className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground text-sm">Génération du code SQL {type.toUpperCase()}...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
                <div className="flex flex-col items-center gap-4 text-red-500">
                    <p className="text-sm font-medium">Erreur: {error}</p>
                </div>
            </Card>
        );
    }

    if (!sql) {
        return (
            <Card className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
                <p className="text-muted-foreground text-sm">Aucun code SQL à afficher</p>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden">
            {/* Header avec actions */}
            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{type.toUpperCase()}</span>
                    <span className="text-muted-foreground text-sm">Script de création de base de données</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Copié !
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copier
                            </>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
                        <Download className="h-4 w-4" />
                        Télécharger .sql
                    </Button>
                </div>
            </div>

            {/* Code SQL */}
            <div className="max-h-[700px] overflow-auto bg-slate-900 p-4">
                <pre className="text-sm leading-relaxed">
                    <code className="font-mono whitespace-pre text-slate-100">
                        {sql.split('\n').map((line, index) => (
                            <div key={index} className="flex">
                                <span className="mr-4 inline-block w-12 text-right text-slate-500 select-none">{index + 1}</span>
                                <span className={getLineClass(line)}>{line}</span>
                            </div>
                        ))}
                    </code>
                </pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-2">
                <p className="text-muted-foreground text-xs">💡 Ce script crée toutes les tables essentielles avec leurs contraintes</p>
                <span className="text-muted-foreground text-xs">{sql.split('\n').length} lignes</span>
            </div>
        </Card>
    );
}

// Fonction pour colorer syntaxiquement les lignes SQL
function getLineClass(line: string): string {
    const trimmed = line.trim();

    // Commentaires
    if (trimmed.startsWith('--')) {
        return 'text-slate-500 italic';
    }

    // Mots-clés SQL principaux
    const keywords = [
        'CREATE',
        'DROP',
        'TABLE',
        'ALTER',
        'ADD',
        'CONSTRAINT',
        'PRIMARY',
        'FOREIGN',
        'KEY',
        'REFERENCES',
        'SET',
        'ENGINE',
        'DEFAULT',
        'CHARSET',
        'NOT NULL',
        'CASCADE',
        'UNIQUE',
    ];

    for (const keyword of keywords) {
        if (trimmed.toUpperCase().includes(keyword)) {
            return 'text-slate-100';
        }
    }

    return 'text-slate-300';
}
