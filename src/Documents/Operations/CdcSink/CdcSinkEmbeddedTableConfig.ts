import { CdcColumnMapping } from "./CdcColumnMapping.js";
import { CdcSinkRelationType } from "./CdcSinkRelationType.js";
import { CdcSinkOnDeleteConfig } from "./CdcSinkOnDeleteConfig.js";
import { CdcSinkLinkedTableConfig } from "./CdcSinkLinkedTableConfig.js";

export interface CdcSinkEmbeddedTableConfig {
    sourceTableSchema: string;
    sourceTableName: string;
    propertyName: string;
    columns: CdcColumnMapping[];
    primaryKeyColumns: string[];
    joinColumns: string[];
    type: CdcSinkRelationType;
    patch: string;
    onDelete: CdcSinkOnDeleteConfig;
    caseSensitiveKeys: boolean;
    embeddedTables: CdcSinkEmbeddedTableConfig[];
    linkedTables: CdcSinkLinkedTableConfig[];
}
