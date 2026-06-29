export interface CdcSinkSourceForeignKey {
    columns: string[];
    referencedSchema: string;
    referencedTable: string;
    referencedColumns: string[];
}
