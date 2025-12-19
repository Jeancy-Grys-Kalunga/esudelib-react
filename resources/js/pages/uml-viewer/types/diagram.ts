export interface DiagramType {
    id: 'class' | 'deployment' | 'packaging' | 'component';
    name: string;
    description: string;
}

export interface DiagramOptions {
    includeModules?: string[];
    excludeModules?: string[];
    showMethods?: boolean;
    showRelations?: boolean;
}

export interface DiagramResponse {
    success: boolean;
    plantUML: string;
    type: string;
}

export interface ExportResponse {
    success: boolean;
    url?: string;
    filename?: string;
}
