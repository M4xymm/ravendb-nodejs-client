import { CdcSinkConfiguration } from "../CdcSinkConfiguration.js";
import { SqlConnectionString } from "../../Etl/ConnectionString.js";
import { TestCdcSinkRowSelector } from "./TestCdcSinkRowSelector.js";
import { TestCdcSinkOperationType } from "./TestCdcSinkOperationType.js";

export interface TestCdcSinkMappingRequest {
    configuration: CdcSinkConfiguration;
    connection: SqlConnectionString;
    sourceTableSchema: string;
    sourceTableName: string;
    rowSelector: TestCdcSinkRowSelector;
    primaryKeyValues: string[];
    operation: TestCdcSinkOperationType;
    maxRows?: number;
}
