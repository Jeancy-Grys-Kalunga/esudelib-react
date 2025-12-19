import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeViewerProps {
    code: string;
}

export function CodeViewer({ code }: CodeViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-medium">Code PlantUML</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Copié !
                        </>
                    ) : (
                        <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copier
                        </>
                    )}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <pre className="max-h-[400px] overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-50">
                        <code>{code}</code>
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
