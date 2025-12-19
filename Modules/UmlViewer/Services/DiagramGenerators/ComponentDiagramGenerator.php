<?php

namespace Modules\UmlViewer\Services\DiagramGenerators;

class ComponentDiagramGenerator
{
    /**
     * Générer le diagramme de composants PlantUML
     */
    public function generate(array $options = []): string
    {
        $plantUML = "@startuml Diagramme de Composants - Système esudelib\n\n";
        $plantUML .= "!theme cerulean-outline\n";
        $plantUML .= "skinparam componentStyle rectangle\n";
        $plantUML .= "skinparam defaultFontSize 14\n";
        $plantUML .= "skinparam componentFontSize 16\n";
        $plantUML .= "skinparam roundcorner 10\n";
        $plantUML .= "skinparam shadowing true\n";
        $plantUML .= "left to right direction\n\n";

        $plantUML .= "title Architecture des Composants - Système esudelib\n\n";

        // Client Layer
        $plantUML .= "rectangle \"🌐 Client Layer\" #E3F2FD {\n";
        $plantUML .= "  component \"React Application\" as react {\n";
        $plantUML .= "    component [Pages] as pages\n";
        $plantUML .= "    component [Components] as components\n";
        $plantUML .= "    component [Inertia.js] as inertia\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Application Layer
        $plantUML .= "rectangle \"⚙️ Application Layer\" #FFF3E0 {\n";
        $plantUML .= "  component \"Laravel Backend\" as laravel {\n";
        $plantUML .= "    component [HTTP Kernel] as kernel\n";
        $plantUML .= "    component [Controllers] as controllers\n";
        $plantUML .= "    component [Middleware] as middleware\n";
        $plantUML .= "  }\n\n";

        $plantUML .= "  package \"Business Modules\" {\n";
        $plantUML .= "    component [Student Module] as student #LightBlue\n";
        $plantUML .= "    component [Institution Module] as institution #LightGreen\n";
        $plantUML .= "    component [Jury Module] as jury #LightCoral\n";
        $plantUML .= "    component [UML Viewer] as uml #LightYellow\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Service Layer
        $plantUML .= "rectangle \"🤖 Service Layer\" #E1F5FE {\n";
        $plantUML .= "  component \"ML Service\" as ml {\n";
        $plantUML .= "    component [Flask API] as flask\n";
        $plantUML .= "    component [Prediction Engine] as predictor\n";
        $plantUML .= "    component [scikit-learn] as sklearn\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Data Layer
        $plantUML .= "rectangle \"💾 Data Layer\" #FCE4EC {\n";
        $plantUML .= "  database \"Postgresql\\n35 Tables\" as postgresql\n";
        $plantUML .= "  database \"Redis\\nCache\" as redis\n";
        $plantUML .= "}\n\n";

        // Connections - Vertical flow
        $plantUML .= "' ============ CONNECTIONS ============\n\n";

        // Client to Application
        $plantUML .= "pages --> inertia\n";
        $plantUML .= "components --> inertia\n";
        $plantUML .= "inertia --> kernel : HTTPS\n\n";

        // Application Internal
        $plantUML .= "kernel --> middleware\n";
        $plantUML .= "middleware --> controllers\n";
        $plantUML .= "controllers --> student\n";
        $plantUML .= "controllers --> institution\n";
        $plantUML .= "controllers --> jury\n";
        $plantUML .= "controllers --> uml\n\n";

        // Application to Services
        $plantUML .= "jury --> flask : REST API\n\n";

        // Services Internal
        $plantUML .= "flask --> predictor\n";
        $plantUML .= "predictor --> sklearn\n\n";

        // Application to Data
        $plantUML .= "student --> postgresql : SQL\n";
        $plantUML .= "institution --> postgresql : SQL\n";
        $plantUML .= "jury --> postgresql : SQL\n";
        $plantUML .= "uml --> postgresql : SQL\n\n";

        $plantUML .= "student --> redis : Cache\n";
        $plantUML .= "institution --> redis : Cache\n";
        $plantUML .= "jury --> redis : Cache\n\n";

        // Legend
        $plantUML .= "legend bottom\n";
        $plantUML .= "  |= Couche |= Composants |= Technologies |\n";
        $plantUML .= "  | Client | React App | TypeScript, Inertia.js |\n";
        $plantUML .= "  | Application | Laravel + Modules | PHP 8.2, 4 modules |\n";
        $plantUML .= "  | Service | ML Service | Python 3.11, Flask |\n";
        $plantUML .= "  | Data | Postgresql + Redis | Bases de données |\n";
        $plantUML .= "endlegend\n\n";

        $plantUML .= "@enduml";

        return $plantUML;
    }
}
