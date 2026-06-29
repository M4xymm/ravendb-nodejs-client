export interface CdcSinkLinkedTableConfig {
    sourceTableSchema: string;
    sourceTableName: string;
    propertyName: string;
    joinColumns: string[];
    linkedCollectionName: string;
}
