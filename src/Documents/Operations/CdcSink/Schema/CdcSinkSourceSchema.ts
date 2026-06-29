import { CdcSinkSourceTable } from "./CdcSinkSourceTable.js";

export interface CdcSinkSourceSchema {
    catalogName: string;
    tables: CdcSinkSourceTable[];
    errors: string[];
    hasPermissionToSetup: boolean;
    warnings: string[];
    success: boolean;
}
