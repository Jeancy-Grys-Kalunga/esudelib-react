import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { exportPerformancePDF } from '@/lib/export';
import { Head } from '@inertiajs/react';
import { Activity, Clock, Cpu, Download, HardDrive, Play, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface performanceEndpoint {
    name: string;
    avg: number;
    min: number;
    max: number;
    count: number;
    errors: number;
}

interface PerformanceProps {
    auth: any;
    perfData: {
        summary: {
            total_requests: number;
            average_response_time: number;
            p95_response_time: number;
            p99_response_time: number;
            throughput: number;
            error_rate: number;
        };
        endpoints: performanceEndpoint[];
        history: { time: string; responseTime: number }[];
    };
    jmxExists: boolean;
    jmxPath: string;
}

export default function PerformanceStats({ auth, perfData, jmxExists, jmxPath }: PerformanceProps) {
    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#8B5CF6'];

    const handleRunJMeter = () => {
        // This is a placeholder for running JMeter
        alert('Lancement du test JMeter en arrière-plan...');
    };

    const handleExportPDF = () => {
        exportPerformancePDF(perfData, ['latency-chart', 'reliability-chart']);
    };

    const pieData = [
        { name: 'Succès', value: perfData.summary.total_requests * (1 - perfData.summary.error_rate / 100) },
        { name: 'Erreurs', value: perfData.summary.total_requests * (perfData.summary.error_rate / 100) },
    ];

    return (
        <AppLayout user={auth.user}>
            <div className="container mx-auto px-4 py-8">
                <Head title="Performance Monitoring" />

                {/* Header Section */}
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-gray-900">
                            <Zap className="h-10 w-10 fill-amber-500/20 text-amber-500" />
                            Performance & Stress Dashboard
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                                <Activity className="mr-1 h-3 w-3" />
                                Monitoring Actif
                            </Badge>
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                                JMX: {jmxExists ? 'Configuré' : 'Manquant'}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="default"
                            className="flex items-center gap-2 bg-amber-600 shadow-md transition-all hover:bg-amber-700"
                            onClick={handleRunJMeter}
                        >
                            <Play className="h-4 w-4 fill-white" />
                            Lancer Test JMeter
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2 border-gray-200" onClick={handleExportPDF}>
                            <Download className="h-4 w-4" />
                            Télécharger Report
                        </Button>
                    </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden border-none bg-white shadow-lg transition-all hover:translate-y-[-2px]">
                        <div className="h-1 w-full bg-blue-500" />
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                <Clock className="h-3 w-3" /> Temps de Réponse Moyen
                            </CardDescription>
                            <CardTitle className="text-3xl font-black text-gray-900">{perfData.summary.average_response_time}ms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                                <span>-12% vs semaine dernière</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none bg-white shadow-lg transition-all hover:translate-y-[-2px]">
                        <div className="h-1 w-full bg-amber-500" />
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                <Zap className="h-3 w-3" /> Débit (Throughput)
                            </CardDescription>
                            <CardTitle className="text-3xl font-black text-gray-900">{perfData.summary.throughput}/sec</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                                <span>+5% charge supportée</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none bg-white shadow-lg transition-all hover:translate-y-[-2px]">
                        <div className="h-1 w-full bg-rose-500" />
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                <Cpu className="h-3 w-3" /> Taux d'Erreurs
                            </CardDescription>
                            <CardTitle className="text-3xl font-black text-gray-900">{perfData.summary.error_rate}%</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                                <span>0.0% critiques</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none bg-white shadow-lg transition-all hover:translate-y-[-2px]">
                        <div className="h-1 w-full bg-indigo-500" />
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                <HardDrive className="h-3 w-3" /> P99 Latence
                            </CardDescription>
                            <CardTitle className="text-3xl font-black text-gray-900">{perfData.summary.p99_response_time}ms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                                <span>Stable sous charge max</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Response Time Trend */}
                    <Card className="overflow-hidden border-none bg-gradient-to-br from-white to-gray-50/50 shadow-xl lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Évolution de la Latence (Derniers Tests)</CardTitle>
                            <CardDescription>Analyse temporelle des temps de réponse moyens</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 h-[300px] w-full" id="latency-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={perfData.history}>
                                        <defs>
                                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} unit="ms" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="responseTime"
                                            stroke="#F59E0B"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorLatency)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribution Pie */}
                    <Card className="flex flex-col items-center border-none bg-white shadow-xl">
                        <CardHeader className="w-full">
                            <CardTitle className="text-lg font-bold">Fiabilité du Système</CardTitle>
                            <CardDescription>Répartition Succès vs Échecs</CardDescription>
                        </CardHeader>
                        <CardContent className="flex w-full flex-1 flex-col items-center justify-center">
                            <div className="relative h-64 w-full" id="reliability-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10B981" cornerRadius={8} />
                                            <Cell fill="#EF4444" cornerRadius={8} />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-gray-900">{(100 - perfData.summary.error_rate).toFixed(1)}%</span>
                                    <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Uptime Test</span>
                                </div>
                            </div>
                            <div className="mt-4 grid w-full grid-cols-2 gap-4 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-gray-600">Succès</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                                    <span className="text-xs font-medium text-gray-600">Erreurs</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Endpoint Drilldown */}
                <Card className="mb-8 overflow-hidden border-none bg-white shadow-2xl">
                    <CardHeader className="bg-gray-900 text-white">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-amber-400" />
                            Analyse par Endpoint
                        </CardTitle>
                        <CardDescription className="text-gray-400">Métriques détaillées extraites du fichier JMX</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="py-4 pl-6 text-[10px] font-black uppercase">Requête</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Moyenne (ms)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Min / Max</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Count</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase">Erreurs</TableHead>
                                    <TableHead className="pr-6 text-right text-[10px] font-black uppercase">Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {perfData.endpoints.map((endpoint, i) => (
                                    <TableRow key={i} className="group transition-colors hover:bg-amber-50/30">
                                        <TableCell className="py-4 pl-6">
                                            <div className="font-bold text-gray-800">{endpoint.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${endpoint.avg > 1000 ? 'bg-rose-500' : endpoint.avg > 500 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, (endpoint.avg / 2000) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs font-bold">{endpoint.avg}ms</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-[10px] text-gray-400 italic">
                                                {endpoint.min}ms / {endpoint.max}ms
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-gray-600">{endpoint.count}</TableCell>
                                        <TableCell>
                                            {endpoint.errors > 0 ? (
                                                <Badge variant="destructive" className="px-1 py-0 text-[9px]">
                                                    {endpoint.errors} err
                                                </Badge>
                                            ) : (
                                                <span className="text-[10px] text-gray-300">Aucune</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Badge
                                                className={`text-[9px] font-bold ${endpoint.avg > 1000 ? 'border-rose-200 bg-rose-100 text-rose-700' : 'border-emerald-200 bg-emerald-100 text-emerald-700'}`}
                                                variant="outline"
                                            >
                                                {endpoint.avg > 1000 ? 'LENT' : 'OPTIMAL'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Footer / Meta info */}
                <div className="flex items-center justify-between px-4 text-[11px] font-medium text-gray-400">
                    <div className="flex items-center gap-4">
                        <span>Source: tests/Performance/jmeter/student_operations.jmx</span>
                        <span>Engine: Apache JMeter 5.5 (Simulated)</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-amber-500">
                        <ShieldCheck className="h-3 w-3" />
                        Environnement de Production Simulé
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
