export interface DatabaseTable {
    name: string;
    module: string;
    columns: DatabaseColumn[];
    indexes: DatabaseIndex[];
    foreignKeys: ForeignKey[];
    primaryKey: string;
}

export interface DatabaseColumn {
    name: string;
    type: string;
    length?: number;
    nullable?: boolean;
    unique?: boolean;
    unsigned?: boolean;
    default?: string | number | boolean;
    autoIncrement?: boolean;
}

export interface DatabaseIndex {
    type: 'index' | 'unique';
    columns: string[];
}

export interface ForeignKey {
    column: string;
    referencedTable: string;
    referencedColumn: string;
}

export interface DatabaseRelation {
    from: string;
    to: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    fromColumn?: string;
    toColumn?: string;
    pivotTable?: string;
}

export interface DatabaseModule {
    name: string;
    tables: string[];
    tableCount: number;
}

export interface DatabaseSchema {
    tables: DatabaseTable[];
    relations: DatabaseRelation[];
    modules: DatabaseModule[];
}
