import { CdcSinkTableConfig } from "./CdcSinkTableConfig.js";
import { CdcSinkPostgresSettings } from "./CdcSinkPostgresSettings.js";

export interface CdcSinkConfiguration {
    taskId: number;
    disabled: boolean;
    name: string;
    mentorNode: string;
    pinToMentorNode: boolean;
    connectionStringName: string;
    tables: CdcSinkTableConfig[];
    postgres: CdcSinkPostgresSettings;
    skipInitialLoad: boolean;
}
