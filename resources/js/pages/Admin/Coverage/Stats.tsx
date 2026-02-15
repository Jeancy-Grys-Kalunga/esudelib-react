import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { exportCoveragePDF } from '@/lib/export';
import { Head } from '@inertiajs/react';
import { AlertCircle, BarChart3, CheckCircle2, Download, Search, Timer, Zap } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TestFile {
    name: string;
    path: string;
    type: string;
    tests: number;
    failures: number;
    errors: number;
    pass_rate: number;
    psr_percentage: number;
    security_percentage: number;
    recommendation: string;
}

interface StatsProps {
    auth: any;
    testStats: Record<string, any>;
    codeCoverage: any;
    testFiles: TestFile[];
}

export default function CoverageStats({ auth, testStats, codeCoverage, testFiles = [] }: StatsProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleExportPDF = () => {
        exportCoveragePDF({ testStats, codeCoverage, testFiles }, ['clover-chart', 'category-chart']);
    };

    // Pre-calculate aggregate stats
    const totalTests = Object.values(testStats).reduce((acc, cat) => acc + (cat.tests || 0), 0);
    const totalFailures = Object.values(testStats).reduce((acc, cat) => acc + (cat.failures || 0), 0);
    const totalErrors = Object.values(testStats).reduce((acc, cat) => acc + (cat.errors || 0), 0);
    const avgPassRate = totalTests > 0 ? ((totalTests - totalFailures - totalErrors) / totalTests) * 100 : 0;

    // Charts Data
    const formatBarData = (category: string) => {
        const data = testStats[category] || { tests: 0, failures: 0, errors: 0, time: 0 };
        return [
            { name: 'Tests', value: data.tests, fill: '#6366F1' },
            { name: 'Echecs', value: data.failures, fill: '#EF4444' },
            { name: 'Erreurs', value: data.errors, fill: '#F43F5E' },
        ];
    };

    const pieData = [
        { name: 'Couvert', value: codeCoverage.coveredelements || 0 },
        { name: 'Non couvert', value: Math.max(0, (codeCoverage.elements || 0) - (codeCoverage.coveredelements || 0)) },
    ];

    const COLORS = ['#10B981', '#F1F5F9'];

    const filteredFiles = testFiles.filter(
        (file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()) || file.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const categories = ['Feature', 'Unit', 'Services', 'Other'];
    const groupedFiles = categories
        .map((cat) => ({
            category: cat,
            files: filteredFiles.filter((f) => f.type === cat),
        }))
        .filter((group) => group.files.length > 0);

    return (
        <AppLayout user={auth.user}>
            <div className="container mx-auto space-y-10 px-6 py-10">
                <Head title="Qualité & Tests" />

                {/* --- HEADER --- */}
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="space-y-2">
                        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tighter text-gray-900">
                            <Zap className="h-10 w-10 fill-indigo-100 text-indigo-600" />
                            Assurance Qualité & Fiabilité
                        </h1>
                        <p className="max-w-2xl font-medium text-gray-500">
                            Analyse complète de la couverture de tests et de la conformité PSR pour l'écosystème ESU-Delib.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl border-gray-200 shadow-sm" onClick={handleExportPDF}>
                            <Download className="mr-2 h-4 w-4" />
                            Rapport PDF
                        </Button>
                        <Button className="rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700">
                            Synchroniser les Stats
                        </Button>
                    </div>
                </div>

                {/* --- TOP KPI CARDS --- */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Total Tests', value: totalTests, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Pass Rate', value: `${avgPassRate.toFixed(1)}%`, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        {
                            label: 'Temps Exécution',
                            value: `${Object.values(testStats)
                                .reduce((acc, c) => acc + (c.time || 0), 0)
                                .toFixed(2)}s`,
                            icon: Timer,
                            color: 'text-amber-600',
                            bg: 'bg-amber-50',
                        },
                        { label: 'Fichiers Analysés', value: testFiles.length, icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map((kpi, i) => (
                        <Card key={i} className="overflow-hidden border-none bg-white/80 shadow-xl shadow-gray-100/50 backdrop-blur-sm">
                            <div className={`h-1.5 w-full ${kpi.bg.replace('bg-', 'bg-').split(' ')[0]}`} />
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className={`rounded-2xl p-3 ${kpi.bg} ${kpi.color}`}>
                                    <kpi.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">{kpi.label}</p>
                                    <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* --- MAIN CHARTS --- */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Coverage Ring */}
                    <Card className="flex flex-col items-center justify-center overflow-hidden border-none bg-white shadow-2xl">
                        <CardHeader className="w-full text-center">
                            <CardTitle className="text-xl font-bold">Couverture Clover</CardTitle>
                            <CardDescription>Score global de santé du code</CardDescription>
                        </CardHeader>
                        <CardContent className="relative flex flex-col items-center">
                            <div className="h-64 w-64" id="clover-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={80} outerRadius={105} paddingAngle={8} dataKey="value" stroke="none">
                                            <Cell fill="#10B981" />
                                            <Cell fill="#F1F5F9" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-emerald-600">{(codeCoverage.percent_covered || 0).toFixed(1)}%</span>
                                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Global Pcov</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Comparison */}
                    <Card className="overflow-hidden border-none bg-white shadow-2xl lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                                <BarChart3 className="h-5 w-5 text-indigo-500" />
                                Distribution par Catégorie
                            </CardTitle>
                            <CardDescription>Volume de tests et taux d'échecs détectés</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 h-[300px]" id="category-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={categories.map((c) => ({
                                            category: c,
                                            tests: testStats[c]?.tests || 0,
                                            failures: testStats[c]?.failures || 0,
                                            errors: testStats[c]?.errors || 0,
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#F8FAFC' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="tests" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={40} />
                                        <Bar dataKey="failures" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- SEARCH & TABLE --- */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-6">
                        <div className="relative max-w-md flex-1">
                            <Input
                                type="text"
                                placeholder="Rechercher un fichier (ex: UserService, Unit...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 rounded-2xl border-gray-200 pl-12 shadow-sm transition-all focus:border-indigo-500 focus:ring-indigo-200"
                            />
                            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                        <Badge variant="outline" className="h-10 rounded-xl border-indigo-100 bg-indigo-50 px-4 font-bold text-indigo-700">
                            {filteredFiles.length} Fichiers Trouvés
                        </Badge>
                    </div>

                    <Card className="overflow-hidden border-none bg-white shadow-2xl">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100">
                                        <TableHead className="py-5 pl-8 text-[11px] font-black tracking-widest text-gray-400 uppercase">
                                            Fichier de Test
                                        </TableHead>
                                        <TableHead className="text-[11px] font-black tracking-widest text-gray-400 uppercase">Tests</TableHead>
                                        <TableHead className="text-[11px] font-black tracking-widest text-gray-400 uppercase">Succès %</TableHead>
                                        <TableHead className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                                            PSR / Sécurité
                                        </TableHead>
                                        <TableHead className="pr-8 text-[11px] font-black tracking-widest text-gray-400 uppercase">
                                            Recommandation
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedFiles.map((group, groupIdx) => (
                                        <div key={groupIdx} className="group contents">
                                            <TableRow className="border-none bg-indigo-50/30 hover:bg-indigo-50/30">
                                                <TableCell colSpan={5} className="py-2 pl-8">
                                                    <span className="text-[10px] font-black tracking-[0.2em] text-indigo-900 uppercase">
                                                        {group.category} Domain
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                            {group.files.map((file, fileIdx) => (
                                                <TableRow key={fileIdx} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                                                    <TableCell className="py-5 pl-8">
                                                        <p className="font-bold text-gray-800">{file.name}</p>
                                                        <p className="max-w-xs truncate text-[10px] font-medium text-gray-400">{file.path}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge className="border-none bg-gray-900/5 font-mono text-gray-900">{file.tests}</Badge>
                                                            {file.failures > 0 && (
                                                                <Badge variant="destructive" className="px-1 text-[9px]">
                                                                    -{file.failures} fail
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${file.pass_rate === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                    style={{ width: `${file.pass_rate}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-900">{file.pass_rate}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`rounded-lg border-none text-[9px] font-bold ${file.psr_percentage >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                                            >
                                                                PSR: {file.psr_percentage}%
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className={`rounded-lg border-none text-[9px] font-bold ${file.security_percentage >= 90 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}
                                                            >
                                                                SEC: {file.security_percentage}%
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-8">
                                                        <div className="flex max-w-xs items-center gap-2 text-xs text-gray-500 italic transition-colors group-hover:text-gray-900">
                                                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                                            {file.recommendation}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </div>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* --- FOOTER CATEGORY CARDS --- */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {categories
                        .filter((c) => c !== 'Other')
                        .map((cat, i) => (
                            <Card key={i} className="overflow-hidden border-none bg-white shadow-lg">
                                <CardHeader className="border-b border-gray-50 pb-2">
                                    <CardTitle className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Analytique {cat}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="h-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={formatBarData(cat)}>
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4 text-[10px] font-black text-gray-400 uppercase">
                                        <span>Payload Temps</span>
                                        <span className="text-indigo-600">{(testStats[cat]?.time || 0).toFixed(3)}s</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        </AppLayout>
    );
}
