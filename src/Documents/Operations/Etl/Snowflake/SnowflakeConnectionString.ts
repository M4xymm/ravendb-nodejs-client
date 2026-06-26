import { ConnectionString, ConnectionStringType } from "../ConnectionString.js";

export class SnowflakeConnectionString extends ConnectionString {
    public connectionString: string;
    public type: ConnectionStringType = "Snowflake";
}
