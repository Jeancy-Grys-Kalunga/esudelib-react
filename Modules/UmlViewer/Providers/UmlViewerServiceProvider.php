<?php

namespace Modules\UmlViewer\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\UmlViewer\Services\DatabaseAnalyzer;
use Modules\UmlViewer\Services\DiagramGenerators\ClassDiagramGenerator;
use Modules\UmlViewer\Services\DiagramGenerators\DeploymentDiagramGenerator;
use Modules\UmlViewer\Services\DiagramGenerators\PackagingDiagramGenerator;
use Modules\UmlViewer\Services\DiagramGenerators\ComponentDiagramGenerator;

class UmlViewerServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'UmlViewer';
    protected string $moduleNameLower = 'umlviewer';

    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->register(RouteServiceProvider::class);

        // Register services as singletons
        $this->app->singleton(DatabaseAnalyzer::class);
        $this->app->singleton(ClassDiagramGenerator::class);
        $this->app->singleton(DeploymentDiagramGenerator::class);
        $this->app->singleton(PackagingDiagramGenerator::class);
        $this->app->singleton(ComponentDiagramGenerator::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerConfig();
        $this->registerViews();
        $this->loadMigrationsFrom(module_path($this->moduleName, 'Database/Migrations'));
    }

    /**
     * Register config.
     */
    protected function registerConfig(): void
    {
        $this->publishes([
            module_path($this->moduleName, 'Config/config.php') => config_path($this->moduleNameLower . '.php'),
        ], 'config');

        $this->mergeConfigFrom(
            module_path($this->moduleName, 'Config/config.php'),
            $this->moduleNameLower
        );
    }

    /**
     * Register views.
     */
    public function registerViews(): void
    {
        $viewPath = resource_path('views/modules/' . $this->moduleNameLower);
        $sourcePath = module_path($this->moduleName, 'Resources/views');

        $this->publishes([
            $sourcePath => $viewPath
        ], ['views', $this->moduleNameLower . '-module-views']);

        $this->loadViewsFrom(array_merge($this->getPublishableViewPaths(), [$sourcePath]), $this->moduleNameLower);
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            DatabaseAnalyzer::class,
            ClassDiagramGenerator::class,
            DeploymentDiagramGenerator::class,
            PackagingDiagramGenerator::class,
            ComponentDiagramGenerator::class,
        ];
    }

    private function getPublishableViewPaths(): array
    {
        $paths = [];
        foreach ($this->app['config']->get('view.paths') as $path) {
            if (is_dir($path . '/modules/' . $this->moduleNameLower)) {
                $paths[] = $path . '/modules/' . $this->moduleNameLower;
            }
        }
        return $paths;
    }
}
