<?php

return [
    'name' => 'UmlViewer',

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'enabled' => env('UML_VIEWER_CACHE_ENABLED', true),
        'ttl' => env('UML_VIEWER_CACHE_TTL', 3600), // 1 heure
        'key_prefix' => 'uml_viewer:',
    ],

    /*
    |--------------------------------------------------------------------------
    | Diagram Configuration
    |--------------------------------------------------------------------------
    */
    'diagrams' => [
        'types' => [
            'class' => [
                'name' => 'Diagramme de Classes',
                'description' => 'Affiche toutes les tables avec leurs relations',
                'icon' => '📊',
            ],
            'deployment' => [
                'name' => 'Diagramme de Déploiement',
                'description' => 'Architecture Docker Swarm',
                'icon' => '🚀',
            ],
            'packaging' => [
                'name' => 'Diagramme de Packaging',
                'description' => 'Organisation en couches et modules',
                'icon' => '📦',
            ],
            'component' => [
                'name' => 'Diagramme de Composants',
                'description' => 'Composants techniques et interfaces',
                'icon' => '🔧',
            ],
        ],

        'export_formats' => ['png', 'svg', 'puml'],

        'plantuml_server' => env('PLANTUML_SERVER_URL', 'https://www.plantuml.com/plantuml'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Analysis Configuration
    |--------------------------------------------------------------------------
    */
    'analysis' => [
        'scan_modules' => true,
        'scan_laravel_migrations' => true,
        'excluded_tables' => [
            'migrations',
            'failed_jobs',
            'password_resets',
        ],
    ],
];
