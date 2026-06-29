export interface CdcSinkTableLoadState {
    initialLoadCompleted: boolean;
    lastKeyValues: string[];
}

export interface CdcSinkTaskState {
    lastLsn: string;
    tables: { [key: string]: CdcSinkTableLoadState };
    configurationName: string;
}
