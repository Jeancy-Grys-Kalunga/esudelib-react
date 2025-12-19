<?php

namespace Modules\UmlViewer\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\UmlViewer\Services\DatabaseAnalyzer;
use Modules\UmlViewer\Services\DiagramGenerators\ClassDiagramGenerator;
use Modules\UmlViewer\Services\DiagramGenerators\DeploymentDiagramGenerator;
use Modules\UmlViewer\Services\DiagramGenerators\PackagingDiagramGenerator;
use Modules\UmlViewer\Services\DiagramGenerators\ComponentDiagramGenerator;

class UmlViewerController extends Controller
{
    public function __construct(
        private DatabaseAnalyzer $analyzer,
        private ClassDiagramGenerator $classDiagramGenerator,
        private DeploymentDiagramGenerator $deploymentDiagramGenerator,
        private PackagingDiagramGenerator $packagingDiagramGenerator,
        private ComponentDiagramGenerator $componentDiagramGenerator
    ) {}

    /**
     * Afficher la page principale du visualiseur UML
     */
    public function index(): Response
    {
        // Analyser la base de données
        $databaseSchema = $this->analyzer->analyze();

        return Inertia::render('uml-viewer/index', [
            'databaseSchema' => $databaseSchema,
            'statistics' => [
                'totalTables' => count($databaseSchema['tables']),
                'totalRelations' => count($databaseSchema['relations']),
                'totalModules' => count($databaseSchema['modules']),
            ],
        ]);
    }

    /**
     * Générer un diagramme spécifique
     */
    public function generateDiagram(Request $request)
    {
        $request->validate([
            'type' => 'required|in:class,deployment,packaging,component',
            'options' => 'array',
        ]);

        $type = $request->input('type');
        $options = $request->input('options', []);

        $plantUML = match ($type) {
            'class' => $this->classDiagramGenerator->generate($options),
            'deployment' => $this->deploymentDiagramGenerator->generate($options),
            'packaging' => $this->packagingDiagramGenerator->generate($options),
            'component' => $this->componentDiagramGenerator->generate($options),
        };

        // Générer l'URL de l'image (pour référence)
        $encoded = $this->encodePlantUML($plantUML);
        $remoteImageUrl = "https://www.plantuml.com/plantuml/png/{$encoded}";

        // Télécharger l'image côté serveur pour éviter les problèmes de longueur d'URL et de CORS
        try {
            // Utiliser POST avec le contenu brut pour éviter les limites de taille d'URL (414 Request-URI Too Large)
            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->withBody($plantUML, 'text/plain')
                ->post('https://www.plantuml.com/plantuml/png');

            if ($response->successful()) {
                $imageContent = $response->body();
                $base64Image = 'data:image/png;base64,' . base64_encode($imageContent);
                $imageUrl = $base64Image;
            } else {
                // Si le POST échoue, essayer avec GET (méthode classique)
                \Illuminate\Support\Facades\Log::warning("PlantUML POST failed (" . $response->status() . "), trying GET fallback...");

                $response = \Illuminate\Support\Facades\Http::timeout(60)->get($remoteImageUrl);

                if ($response->successful()) {
                    $imageContent = $response->body();
                    $base64Image = 'data:image/png;base64,' . base64_encode($imageContent);
                    $imageUrl = $base64Image;
                } else {
                    // Fallback sur l'URL distante
                    \Illuminate\Support\Facades\Log::warning("PlantUML GET failed: " . $response->status());
                    $imageUrl = $remoteImageUrl;
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PlantUML fetch error: " . $e->getMessage());
            // Fallback sur l'URL distante en cas d'exception
            $imageUrl = $remoteImageUrl;
        }

        return response()->json([
            'success' => true,
            'plantUML' => $plantUML,
            'imageUrl' => $imageUrl, // Contient maintenant le Base64 ou l'URL distante
            'type' => $type,
        ]);
    }

    /**
     * Exporter un diagramme
     */
    public function exportDiagram(Request $request)
    {
        $request->validate([
            'type' => 'required|in:class,deployment,packaging,component',
            'format' => 'required|in:png,svg,puml',
            'plantUML' => 'required|string',
        ]);

        $type = $request->input('type');
        $format = $request->input('format');
        $plantUML = $request->input('plantUML');

        $filename = "diagram_{$type}_" . now()->format('Y-m-d_His') . ".{$format}";

        \Illuminate\Support\Facades\Log::info("Export diagram request: type={$type}, format={$format}, plantUML length=" . strlen($plantUML));

        if ($format === 'puml') {
            return response($plantUML)
                ->header('Content-Type', 'text/plain')
                ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
        }

        // Pour PNG et SVG, on doit POSTer le contenu pour éviter les limites de taille d'URL
        try {
            \Illuminate\Support\Facades\Log::info("Sending request to PlantUML server...");

            $response = \Illuminate\Support\Facades\Http::timeout(120) // Augmenter le timeout à 120s
                ->withBody($plantUML, 'text/plain')
                ->post("https://www.plantuml.com/plantuml/{$format}");

            \Illuminate\Support\Facades\Log::info("PlantUML response: status=" . $response->status() . ", size=" . strlen($response->body()));

            if ($response->successful()) {
                $imageContent = $response->body();

                // Vérifier que nous avons bien reçu une image
                if (empty($imageContent)) {
                    \Illuminate\Support\Facades\Log::error("PlantUML returned empty content");
                    return response()->json([
                        'success' => false,
                        'message' => "Le serveur PlantUML a retourné un contenu vide",
                    ], 500);
                }

                return response($imageContent)
                    ->header('Content-Type', $format === 'svg' ? 'image/svg+xml' : 'image/png')
                    ->header('Content-Disposition', "attachment; filename=\"{$filename}\"")
                    ->header('Content-Length', strlen($imageContent));
            }

            \Illuminate\Support\Facades\Log::error("PlantUML request failed: " . $response->status() . " - " . $response->body());

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de la génération de l'image (Status: " . $response->status() . ")",
            ], 500);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PlantUML export exception: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => "Erreur de connexion au service PlantUML: " . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'une table
     */
    public function getTableDetails(Request $request, string $tableName)
    {
        $databaseSchema = $this->analyzer->analyze();

        $table = collect($databaseSchema['tables'])->firstWhere('name', $tableName);

        if (!$table) {
            return response()->json([
                'success' => false,
                'message' => 'Table non trouvée',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'table' => $table,
        ]);
    }

    /**
     * Encoder PlantUML pour l'URL
     */
    private function encodePlantUML(string $plantUML): string
    {
        $compressed = gzdeflate($plantUML, 9);
        $encoded = '';

        for ($i = 0; $i < strlen($compressed); $i += 3) {
            $b1 = ord($compressed[$i]);
            $b2 = $i + 1 < strlen($compressed) ? ord($compressed[$i + 1]) : 0;
            $b3 = $i + 2 < strlen($compressed) ? ord($compressed[$i + 2]) : 0;

            $encoded .= $this->encode6bit($b1 >> 2);
            $encoded .= $this->encode6bit((($b1 & 0x3) << 4) | ($b2 >> 4));
            $encoded .= $this->encode6bit((($b2 & 0xF) << 2) | ($b3 >> 6));
            $encoded .= $this->encode6bit($b3 & 0x3F);
        }

        return $encoded;
    }

    private function encode6bit(int $b): string
    {
        if ($b < 10) {
            return chr(48 + $b);
        }
        $b -= 10;
        if ($b < 26) {
            return chr(65 + $b);
        }
        $b -= 26;
        if ($b < 26) {
            return chr(97 + $b);
        }
        $b -= 26;
        if ($b == 0) {
            return '-';
        }
        if ($b == 1) {
            return '_';
        }
        return '?';
    }
}
