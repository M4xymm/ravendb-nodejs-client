import { EtlConfiguration } from "../EtlConfiguration.js";
import { EtlType } from "../ConnectionString.js";
import { SnowflakeConnectionString } from "./SnowflakeConnectionString.js";
import { DocumentConventions } from "../../../Conventions/DocumentConventions.js";

export interface SnowflakeEtlTable {
    tableName: string;
    documentIdColumn: string;
    insertOnlyMode: boolean;
}

export class SnowflakeEtlConfiguration extends EtlConfiguration<SnowflakeConnectionString> {
    public commandTimeout?: number;
    public snowflakeTables: SnowflakeEtlTable[];

    public etlType: EtlType = "Snowflake";

    public serialize(conventions: DocumentConventions): object {
        const result = super.serialize(conventions) as any;
        result.EtlType = this.etlType;
        result.CommandTimeout = this.commandTimeout;
        result.SnowflakeTables = this.snowflakeTables ? this.snowflakeTables.map(this.serializeTable) : null;
        return result;
    }

    private serializeTable(table: SnowflakeEtlTable) {
        return {
            TableName: table.tableName,
            DocumentIdColumn: table.documentIdColumn,
            InsertOnlyMode: table.insertOnlyMode
        }
    }
}
