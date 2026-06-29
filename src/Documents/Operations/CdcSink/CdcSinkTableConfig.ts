import { CdcColumnMapping } from "./CdcColumnMapping.js";
import { CdcSinkOnDeleteConfig } from "./CdcSinkOnDeleteConfig.js";
import { CdcSinkEmbeddedTableConfig } from "./CdcSinkEmbeddedTableConfig.js";
import { CdcSinkLinkedTableConfig } from "./CdcSinkLinkedTableConfig.js";

export interface CdcSinkTableConfig {
    collectionName: string;
    sourceTableSchema: string;
    sourceTableName: string;
    columns: CdcColumnMapping[];
    primaryKeyColumns: string[];
    patch: string;
    onDelete: CdcSinkOnDeleteConfig;
    disabled: boolean;
    embeddedTables: CdcSinkEmbeddedTableConfig[];
    linkedTables: CdcSinkLinkedTableConfig[];
}
