<?php

namespace Modules\UmlViewer\Services\DiagramGenerators;

class PackagingDiagramGenerator
{
    /**
     * Générer le diagramme de packaging PlantUML
     */
    public function generate(array $options = []): string
    {
        $plantUML = "@startuml Diagramme de Packaging - Architecture esudelib\n\n";
        $plantUML .= "!theme cerulean-outline\n";
        $plantUML .= "skinparam packageStyle rectangle\n";
        $plantUML .= "skinparam defaultFontSize 14\n";
        $plantUML .= "skinparam packageFontSize 16\n";
        $plantUML .= "skinparam roundcorner 10\n";
        $plantUML .= "skinparam shadowing true\n\n";

        $plantUML .= "title Architecture en Couches - Système esudelib\n\n";

        // Layer: Presentation
        $plantUML .= "package \"📱 Presentation Layer\" #E3F2FD {\n";
        $plantUML .= "  [Pages]\n";
        $plantUML .= "  [Components]\n";
        $plantUML .= "  [Inertia.js]\n";
        $plantUML .= "}\n\n";

        // Layer: Application
        $plantUML .= "package \"⚙️ Application Layer\" #FFF3E0 {\n";
        $plantUML .= "  [Controllers]\n";
        $plantUML .= "  [Middleware]\n";
        $plantUML .= "  [Authentication]\n\n";

        $plantUML .= "  package \"Business Modules\" {\n";
        $plantUML .= "    [🎓 Student Module]\n";
        $plantUML .= "    [🏛️ Institution Module]\n";
        $plantUML .= "    [⚖️ Jury Module]\n";
        $plantUML .= "    [📊 UmlViewer Module]\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Layer: Domain
        $plantUML .= "package \"💼 Domain Layer\" #E8F5E9 {\n";
        $plantUML .= "  [Services]\n";
        $plantUML .= "  [Business Rules]\n";
        $plantUML .= "  [Events]\n";
        $plantUML .= "}\n\n";

        // Layer: Infrastructure
        $plantUML .= "package \"🔧 Infrastructure Layer\" #F3E5F5 {\n";
        $plantUML .= "  [Eloquent ORM]\n";
        $plantUML .= "  [Redis Cache]\n";
        $plantUML .= "  [Queue System]\n";
        $plantUML .= "}\n\n";

        // Layer: ML Service
        $plantUML .= "package \"🤖 ML Service\" #E1F5FE {\n";
        $plantUML .= "  [Flask API]\n";
        $plantUML .= "  [Predictor]\n";
        $plantUML .= "  [scikit-learn]\n";
        $plantUML .= "}\n\n";

        // Layer: Data
        $plantUML .= "package \"💾 Data Layer\" #FCE4EC {\n";
        $plantUML .= "  database \"MySQL\" {\n";
        $plantUML .= "    [35 Tables]\n";
        $plantUML .= "  }\n";
        $plantUML .= "  database \"Redis\" {\n";
        $plantUML .= "    [Cache Data]\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Dependencies
        $plantUML .= "' ============ DEPENDENCIES ============\n\n";

        // Presentation -> Application
        $plantUML .= "[Pages] --> [Inertia.js]\n";
        $plantUML .= "[Inertia.js] --> [Controllers]\n";
        $plantUML .= "[Controllers] --> [Middleware]\n\n";

        // Application -> Domain
        $plantUML .= "[Controllers] --> [🎓 Student Module]\n";
        $plantUML .= "[Controllers] --> [⚖️ Jury Module]\n";
        $plantUML .= "[🎓 Student Module] --> [Services]\n";
        $plantUML .= "[⚖️ Jury Module] --> [Services]\n\n";

        // Domain -> Infrastructure
        $plantUML .= "[Services] --> [Eloquent ORM]\n";
        $plantUML .= "[Services] --> [Redis Cache]\n\n";

        // Infrastructure -> Data
        $plantUML .= "[Eloquent ORM] --> [35 Tables]\n";
        $plantUML .= "[Redis Cache] --> [Cache Data]\n\n";

        // ML Service
        $plantUML .= "[⚖️ Jury Module] --> [Flask API]\n";
        $plantUML .= "[Flask API] --> [Predictor]\n";
        $plantUML .= "[Predictor] --> [scikit-learn]\n\n";

        // Legend
        $plantUML .= "legend right\n";
        $plantUML .= "  **Architecture**: Clean Architecture\n";
        $plantUML .= "  **Modules**: 4 modules essentiels\n";
        $plantUML .= "  **Technologies**: Laravel, React, Python\n";
        $plantUML .= "endlegend\n\n";

        $plantUML .= "@enduml";

        return $plantUML;
    }
}
