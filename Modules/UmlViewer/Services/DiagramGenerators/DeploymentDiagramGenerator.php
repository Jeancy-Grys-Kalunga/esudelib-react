<?php

namespace Modules\UmlViewer\Services\DiagramGenerators;

class DeploymentDiagramGenerator
{
    /**
     * Générer le diagramme de déploiement PlantUML
     */
    public function generate(array $options = []): string
    {
        $plantUML = "@startuml Diagramme de Déploiement - Architecture esudelib\n\n";
        $plantUML .= "!theme cerulean-outline\n";
        $plantUML .= "skinparam componentStyle rectangle\n";
        $plantUML .= "skinparam nodeStyle rectangle\n";
        $plantUML .= "skinparam defaultFontSize 14\n";
        $plantUML .= "skinparam nodeFontSize 16\n";
        $plantUML .= "skinparam roundcorner 10\n";
        $plantUML .= "skinparam shadowing true\n";
        // $plantUML .= "skinparam dpi 300\n";
        // $plantUML .= "scale max 4096 width\n\n";

        $plantUML .= "title Architecture Docker Swarm - Système esudelib\n\n";

        // Internet et utilisateurs
        $plantUML .= "' ============ INTERNET ============\n\n";
        $plantUML .= "cloud \"🌐 Internet\" {\n";
        $plantUML .= "  actor \"Étudiants\" as students #LightBlue\n";
        $plantUML .= "  actor \"Enseignants\" as teachers #LightGreen\n";
        $plantUML .= "  actor \"Jury\" as jury #LightCoral\n";
        $plantUML .= "  actor \"Administrateurs\" as admins #LightYellow\n";
        $plantUML .= "}\n\n";

        // Load Balancers
        $plantUML .= "' ============ LOAD BALANCERS ============\n\n";
        $plantUML .= "rectangle \"Load Balancers (2 réplicas)\" #LightGreen {\n";
        $plantUML .= "  component \"Nginx LB 1\" as nginx1 <<Container>>\n";
        $plantUML .= "  component \"Nginx LB 2\" as nginx2 <<Container>>\n";
        $plantUML .= "  note right of nginx1\n";
        $plantUML .= "    Port: 80, 443\n";
        $plantUML .= "    SSL/TLS Termination\n";
        $plantUML .= "    Rate Limiting\n";
        $plantUML .= "    Gzip Compression\n";
        $plantUML .= "  end note\n";
        $plantUML .= "}\n\n";

        // Application Layer
        $plantUML .= "' ============ APPLICATION LAYER ============\n\n";
        $plantUML .= "rectangle \"Application Layer (8 réplicas)\" #LightYellow {\n\n";

        // Laravel Backend
        $plantUML .= "  rectangle \"Laravel Backend (3 réplicas)\" {\n";
        $plantUML .= "    component \"Laravel 1\" as laravel1 <<Container>>\n";
        $plantUML .= "    component \"Laravel 2\" as laravel2 <<Container>>\n";
        $plantUML .= "    component \"Laravel 3\" as laravel3 <<Container>>\n";
        $plantUML .= "    note right of laravel1\n";
        $plantUML .= "      Port: 9000\n";
        $plantUML .= "      PHP 8.2 FPM\n";
        $plantUML .= "      Supervisor\n";
        $plantUML .= "      Queue Workers\n";
        $plantUML .= "      Scheduler\n";
        $plantUML .= "    end note\n";
        $plantUML .= "  }\n\n";

        // Python ML Service
        $plantUML .= "  rectangle \"Python ML Service (3 réplicas)\" {\n";
        $plantUML .= "    component \"ML Service 1\" as ml1 <<Container>>\n";
        $plantUML .= "    component \"ML Service 2\" as ml2 <<Container>>\n";
        $plantUML .= "    component \"ML Service 3\" as ml3 <<Container>>\n";
        $plantUML .= "    note right of ml1\n";
        $plantUML .= "      Port: 5000\n";
        $plantUML .= "      Flask API\n";
        $plantUML .= "      scikit-learn\n";
        $plantUML .= "      Gradient Boosting\n";
        $plantUML .= "      Model: .pkl\n";
        $plantUML .= "    end note\n";
        $plantUML .= "  }\n\n";

        // React Frontend
        $plantUML .= "  rectangle \"React Frontend (2 réplicas)\" {\n";
        $plantUML .= "    component \"React 1\" as react1 <<Container>>\n";
        $plantUML .= "    component \"React 2\" as react2 <<Container>>\n";
        $plantUML .= "    note right of react1\n";
        $plantUML .= "      Port: 3000\n";
        $plantUML .= "      Vite Build\n";
        $plantUML .= "      TypeScript\n";
        $plantUML .= "      Inertia.js\n";
        $plantUML .= "      Nginx Server\n";
        $plantUML .= "    end note\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Data Layer
        $plantUML .= "' ============ DATA LAYER ============\n\n";
        $plantUML .= "rectangle \"Data Layer (6 réplicas)\" #LightCoral {\n\n";

        // MySQL Cluster
        $plantUML .= "  database \"MySQL Cluster\" {\n";
        $plantUML .= "    component \"MySQL Master\" as mysql_master <<Container>>\n";
        $plantUML .= "    database \"35 Tables\\nesudelib_db\" as db1\n";
        $plantUML .= "    component \"MySQL Slave 1\" as mysql_slave1 <<Container>>\n";
        $plantUML .= "    component \"MySQL Slave 2\" as mysql_slave2 <<Container>>\n";
        $plantUML .= "    note right of mysql_master\n";
        $plantUML .= "      Port: 3306\n";
        $plantUML .= "      Binlog Replication\n";
        $plantUML .= "      Automatic Failover\n";
        $plantUML .= "      InnoDB Engine\n";
        $plantUML .= "    end note\n";
        $plantUML .= "  }\n\n";

        // Redis Cluster
        $plantUML .= "  database \"Redis Cluster\" {\n";
        $plantUML .= "    component \"Redis Master\" as redis_master <<Container>>\n";
        $plantUML .= "    component \"Redis Replica\" as redis_replica <<Container>>\n";
        $plantUML .= "    note right of redis_master\n";
        $plantUML .= "      Port: 6379\n";
        $plantUML .= "      Cache + Sessions\n";
        $plantUML .= "      Queue Jobs\n";
        $plantUML .= "      RDB + AOF\n";
        $plantUML .= "    end note\n";
        $plantUML .= "  }\n";
        $plantUML .= "}\n\n";

        // Storage
        $plantUML .= "' ============ STORAGE ============\n\n";
        $plantUML .= "storage \"Shared Storage (NFS)\" as nfs #LightGray {\n";
        $plantUML .= "  folder \"ml_models\" as vol_models\n";
        $plantUML .= "  folder \"app_storage\" as vol_storage\n";
        $plantUML .= "  folder \"mysql_data\" as vol_mysql\n";
        $plantUML .= "  folder \"redis_data\" as vol_redis\n";
        $plantUML .= "  folder \"logs\" as vol_logs\n";
        $plantUML .= "  folder \"backups\" as vol_backups\n";
        $plantUML .= "}\n\n";

        // Monitoring Stack
        $plantUML .= "' ============ MONITORING ============\n\n";
        $plantUML .= "rectangle \"Monitoring Stack\" #Lavender {\n";
        $plantUML .= "  component \"Prometheus\" as prometheus <<Container>>\n";
        $plantUML .= "  component \"Grafana\" as grafana <<Container>>\n";
        $plantUML .= "  component \"Portainer\" as portainer <<Container>>\n";
        $plantUML .= "  note right of prometheus\n";
        $plantUML .= "    Port: 9090\n";
        $plantUML .= "    Métriques\n";
        $plantUML .= "    Alertes\n";
        $plantUML .= "    Retention: 15j\n";
        $plantUML .= "  end note\n";
        $plantUML .= "}\n\n";

        // Connections
        $plantUML .= "' ============ CONNECTIONS ============\n\n";

        // Users to Load Balancers
        $plantUML .= "students --> nginx1 : HTTPS\n";
        $plantUML .= "teachers --> nginx1 : HTTPS\n";
        $plantUML .= "jury --> nginx2 : HTTPS\n";
        $plantUML .= "admins --> nginx2 : HTTPS\n\n";

        // Load Balancers to Backend
        $plantUML .= "nginx1 --> laravel1 : HTTP\n";
        $plantUML .= "nginx1 --> laravel2 : HTTP\n";
        $plantUML .= "nginx1 --> laravel3 : HTTP\n";
        $plantUML .= "nginx2 --> laravel1 : HTTP\n";
        $plantUML .= "nginx2 --> laravel2 : HTTP\n";
        $plantUML .= "nginx2 --> laravel3 : HTTP\n\n";

        // Load Balancers to Frontend
        $plantUML .= "nginx1 --> react1 : HTTP\n";
        $plantUML .= "nginx1 --> react2 : HTTP\n";
        $plantUML .= "nginx2 --> react1 : HTTP\n";
        $plantUML .= "nginx2 --> react2 : HTTP\n\n";

        // Backend to ML
        $plantUML .= "laravel1 --> ml1 : REST API\n";
        $plantUML .= "laravel2 --> ml2 : REST API\n";
        $plantUML .= "laravel3 --> ml3 : REST API\n\n";

        // Backend to Database
        $plantUML .= "laravel1 --> mysql_master : SQL (Write)\n";
        $plantUML .= "laravel2 --> mysql_master : SQL (Write)\n";
        $plantUML .= "laravel3 --> mysql_master : SQL (Write)\n";
        $plantUML .= "laravel1 --> mysql_slave1 : SQL (Read)\n";
        $plantUML .= "laravel2 --> mysql_slave2 : SQL (Read)\n\n";

        // Backend to Cache
        $plantUML .= "laravel1 --> redis_master : Cache\n";
        $plantUML .= "laravel2 --> redis_master : Cache\n";
        $plantUML .= "laravel3 --> redis_master : Cache\n\n";

        // Database Replication
        $plantUML .= "mysql_master --> mysql_slave1 : Replication\n";
        $plantUML .= "mysql_master --> mysql_slave2 : Replication\n";
        $plantUML .= "redis_master --> redis_replica : Replication\n\n";

        // Database to Storage
        $plantUML .= "mysql_master --> db1\n";
        $plantUML .= "mysql_master --> vol_mysql : Mount\n";
        $plantUML .= "redis_master --> vol_redis : Mount\n\n";

        // ML to Storage
        $plantUML .= "ml1 --> vol_models : Mount\n";
        $plantUML .= "ml2 --> vol_models : Mount\n";
        $plantUML .= "ml3 --> vol_models : Mount\n\n";

        // Backend to Storage
        $plantUML .= "laravel1 --> vol_storage : Mount\n";
        $plantUML .= "laravel2 --> vol_storage : Mount\n";
        $plantUML .= "laravel3 --> vol_storage : Mount\n";
        $plantUML .= "laravel1 --> vol_logs : Mount\n\n";

        // Monitoring
        $plantUML .= "prometheus --> laravel1 : Metrics\n";
        $plantUML .= "prometheus --> mysql_master : Metrics\n";
        $plantUML .= "prometheus --> redis_master : Metrics\n";
        $plantUML .= "prometheus --> nginx1 : Metrics\n";
        $plantUML .= "grafana --> prometheus : Query\n";
        $plantUML .= "portainer ..> nginx1 : Manage\n";
        $plantUML .= "portainer ..> laravel1 : Manage\n\n";

        // Networks
        $plantUML .= "' ============ NETWORKS ============\n\n";
        $plantUML .= "package \"Docker Networks\" {\n";
        $plantUML .= "  [frontend_network] #LightBlue\n";
        $plantUML .= "  [backend_network] #LightGreen\n";
        $plantUML .= "  [database_network] #LightCoral\n";
        $plantUML .= "}\n\n";

        // Legend
        $plantUML .= "legend bottom\n";
        $plantUML .= "  |= Service |= Réplicas |= Port |= Ressources |\n";
        $plantUML .= "  | Nginx | 2 | 80/443 | 0.5 CPU, 256M |\n";
        $plantUML .= "  | Laravel | 3 | 9000 | 1 CPU, 512M |\n";
        $plantUML .= "  | Python ML | 3 | 5000 | 2 CPU, 1G |\n";
        $plantUML .= "  | React | 2 | 3000 | 0.5 CPU, 256M |\n";
        $plantUML .= "  | MySQL | 3 | 3306 | 2 CPU, 2G |\n";
        $plantUML .= "  | Redis | 2 | 6379 | 1 CPU, 512M |\n";
        $plantUML .= "  | Monitoring | 3 | Varies | 1 CPU, 1G |\n";
        $plantUML .= "  | **Total** | **14** | - | **~12 CPU, ~8G** |\n";
        $plantUML .= "endlegend\n\n";

        $plantUML .= "@enduml";

        return $plantUML;
    }
}
