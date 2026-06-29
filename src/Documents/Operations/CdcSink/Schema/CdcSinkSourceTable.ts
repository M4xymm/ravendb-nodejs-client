import { CdcSinkSourceColumn } from "./CdcSinkSourceColumn.js";
import { CdcSinkSourceForeignKey } from "./CdcSinkSourceForeignKey.js";

export interface CdcSinkSourceTable {
    sourceTableSchema: string;
    sourceTableName: string;
    columns: CdcSinkSourceColumn[];
    primaryKeyColumns: string[];
    foreignKeys: CdcSinkSourceForeignKey[];
    isCdcEnabled: boolean;
    unsupportedReason: string;
    warnings: string[];
}
