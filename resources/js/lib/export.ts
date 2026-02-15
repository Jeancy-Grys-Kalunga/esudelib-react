import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

interface SummaryData {
    total_requests: number;
    average_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    throughput: number;
    error_rate: number;
}

interface Endpoint {
    name: string;
    avg: number;
    min: number;
    max: number;
    count: number;
    errors: number;
}

interface PerformanceData {
    summary: SummaryData;
    endpoints: Endpoint[];
}

interface CoverageData {
    testStats: Record<string, any>;
    codeCoverage: any;
    testFiles: any[];
}

/**
 * Professional PDF Export for Performance Report
 */
export const exportPerformancePDF = async (data: PerformanceData, chartIds: string[]) => {
    const toastId = toast.info('Génération du rapport de performance...', { autoClose: false });

    try {
        const doc = new jsPDF() as any;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Header
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ESU-DELIB PERFORMANCE REPORT', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Généré le: ${new Date().toLocaleString()}`, 15, 33);
        doc.text('Confidentiel - Usage Interne', pageWidth - 60, 33);

        // 2. Summary Section
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Sommaire Exécutif', 15, 55);

        const summaryData = [
            ['Total des Requêtes', (data.summary?.total_requests || 0).toString()],
            ['Temps de Réponse Moyen', `${data.summary?.average_response_time || 0}ms`],
            ['Latence P95', `${data.summary?.p95_response_time || 0}ms`],
            ['Latence P99', `${data.summary?.p99_response_time || 0}ms`],
            ['Débit (Throughput)', `${data.summary?.throughput || 0} req/sec`],
            ["Taux d'Erreur", `${data.summary?.error_rate || 0}%`],
        ];

        autoTable(doc, {
            startY: 60,
            head: [['Métrique', 'Valeur']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] },
        });

        // 3. Charts Analysis
        let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 120;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Analyse Graphique', 15, currentY);
        currentY += 10;

        for (const chartId of chartIds) {
            const chartElement = document.getElementById(chartId);
            if (chartElement) {
                try {
                    const canvas = await html2canvas(chartElement, {
                        scale: 1.5, // Reduced slightly for better compatibility
                        useCORS: true,
                        backgroundColor: '#ffffff',
                    });
                    const imgData = canvas.toDataURL('image/png');

                    const imgWidth = pageWidth - 32;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    if (currentY + imgHeight > pageHeight - 20) {
                        doc.addPage();
                        currentY = 20;
                    }

                    doc.addImage(imgData, 'PNG', 16, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 15;
                } catch (err) {
                    console.warn(`Could not capture chart ${chartId}:`, err);
                }
            }
        }

        // 4. Detailed Endpoints Table
        if (currentY + 50 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Détails par Endpoint', 15, currentY);

        const endpointData = (data.endpoints || []).map((e) => [
            e.name || 'N/A',
            `${e.avg || 0}ms`,
            `${e.min || 0}ms / ${e.max || 0}ms`,
            (e.count || 0).toString(),
            (e.errors || 0) > 0 ? `${e.errors} (FAIL)` : '0',
            (e.avg || 0) > 1000 ? 'LENT' : 'OPTIMAL',
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Endpoint', 'Moyenne', 'Min / Max', 'Count', 'Erreurs', 'Statut']],
            body: endpointData,
            theme: 'grid',
            headStyles: { fillColor: [31, 41, 55] },
            didParseCell: (cellData) => {
                if (cellData.section === 'body' && cellData.column.index === 5) {
                    if (cellData.cell.raw === 'LENT') {
                        cellData.cell.styles.textColor = [239, 68, 68];
                    } else if (cellData.cell.raw === 'OPTIMAL') {
                        cellData.cell.styles.textColor = [16, 185, 129];
                    }
                }
            },
        });

        // Pagination
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text('ESU-DELIB - Performance Monitoring', 15, pageHeight - 10);
        }

        doc.save(`PerformanceReport_${new Date().toISOString().split('T')[0]}.pdf`);

        toast.update(toastId, {
            render: 'Rapport généré avec succès !',
            type: 'success',
            autoClose: 3000,
        });
    } catch (error: any) {
        console.error('PDF Export Error:', error);
        toast.update(toastId, {
            render: `Erreur: ${error.message || 'Problème de génération'}`,
            type: 'error',
            autoClose: 5000,
        });
    }
};

/**
 * Professional PDF Export for Coverage Report
 */
export const exportCoveragePDF = async (data: CoverageData, chartIds: string[]) => {
    const toastId = toast.info('Génération du rapport de couverture...', { autoClose: false });

    try {
        const doc = new jsPDF() as any;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('RAPPORT DE COUVERTURE DE CODE', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Qualité Assurance - ${new Date().toLocaleDateString()}`, 15, 33);
        doc.text('Projet: ESU-DELIB', pageWidth - 60, 33);

        // KPI Section
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Indicateurs Clés de Qualité', 15, 55);

        const totalTests = Object.values(data.testStats || {}).reduce((acc: number, cat: any) => acc + (cat?.tests || 0), 0);
        const avgPassRate =
            (data.testFiles?.length || 0) > 0
                ? (data.testFiles!.reduce((acc: number, f: any) => acc + (f.pass_rate || 0), 0) / data.testFiles!.length).toFixed(1)
                : '0';

        const kpiData = [
            ['Couverture Clover Globale', `${(data.codeCoverage?.percent_covered || 0).toFixed(1)}%`],
            ['Taux de Réussite Moyen', `${avgPassRate}%`],
            ['Nombre de Tests Total', totalTests.toString()],
            ['Fichiers de Tests Analysés', (data.testFiles?.length || 0).toString()],
        ];

        autoTable(doc, {
            startY: 60,
            body: kpiData,
            theme: 'plain',
            styles: { fontSize: 12, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
        });

        // Charts
        let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 100;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Visualisation des Données', 15, currentY);
        currentY += 10;

        for (const chartId of chartIds) {
            const chartElement = document.getElementById(chartId);
            if (chartElement) {
                try {
                    const canvas = await html2canvas(chartElement, {
                        scale: 1.5,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 100;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    if (currentY + imgHeight > pageHeight - 20) {
                        doc.addPage();
                        currentY = 20;
                    }

                    doc.addImage(imgData, 'PNG', 15, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 15;
                } catch (err) {
                    console.warn(`Could not capture chart ${chartId}:`, err);
                }
            }
        }

        // Detailed Files Table
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Analyse par Fichier de Test', 15, 20);

        const fileData = (data.testFiles || []).map((f: any) => [
            f.name || 'N/A',
            f.type || 'Other',
            (f.tests || 0).toString(),
            `${f.pass_rate || 0}%`,
            `PSR: ${f.psr_percentage || 0}%`,
            f.recommendation || '-',
        ]);

        autoTable(doc, {
            startY: 25,
            head: [['Fichier', 'Catégorie', 'Tests', 'Succès', 'Conformité', 'Recommandation']],
            body: fileData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 8 },
            columnStyles: {
                5: { cellWidth: 50 },
            },
        });

        // Pagination
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`CoverageReport_${new Date().toISOString().split('T')[0]}.pdf`);

        toast.update(toastId, {
            render: 'Rapport généré avec succès !',
            type: 'success',
            autoClose: 3000,
        });
    } catch (error: any) {
        console.error('PDF Export Error:', error);
        toast.update(toastId, {
            render: `Erreur: ${error.message || 'Problème de génération'}`,
            type: 'error',
            autoClose: 5000,
        });
    }
};
