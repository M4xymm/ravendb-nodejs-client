import { SqlConnectionString } from "../../Etl/ConnectionString.js";

export interface CdcSinkSchemaRequest {
    connection: SqlConnectionString;
    connectionStringName: string;
    schemas: string[];
}
