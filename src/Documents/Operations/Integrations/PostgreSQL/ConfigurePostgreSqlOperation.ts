import { IMaintenanceOperation, OperationResultType } from "../../OperationAbstractions.js";
import { RavenCommand } from "../../../../Http/RavenCommand.js";
import { HttpRequestParameters } from "../../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../../Conventions/DocumentConventions.js";
import { ServerNode } from "../../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../../Utility/RaftIdGenerator.js";
import { throwError } from "../../../../Exceptions/index.js";
import { PostgreSqlConfiguration } from "../../../../ServerWide/Operations/Integrations/PostgreSql/PostgreSqlConfiguration.js";
import { ConfigurePostgreSqlOperationResult } from "./ConfigurePostgreSqlOperationResult.js";

export class ConfigurePostgreSqlOperation implements IMaintenanceOperation<ConfigurePostgreSqlOperationResult> {
    private readonly _configuration: PostgreSqlConfiguration;

    public constructor(configuration: PostgreSqlConfiguration) {
        if (!configuration) {
            throwError("InvalidArgumentException", "Configuration cannot be null");
        }
        this._configuration = configuration;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<ConfigurePostgreSqlOperationResult> {
        return new ConfigurePostgreSqlCommand(conventions, this._configuration);
    }
}

export class ConfigurePostgreSqlCommand extends RavenCommand<ConfigurePostgreSqlOperationResult> implements IRaftCommand {
    private readonly _conventions: DocumentConventions;
    private readonly _configuration: PostgreSqlConfiguration;

    public constructor(conventions: DocumentConventions, configuration: PostgreSqlConfiguration) {
        super();

        if (!conventions) {
            throwError("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!configuration) {
            throwError("InvalidArgumentException", "Configuration cannot be null");
        }

        this._conventions = conventions;
        this._configuration = configuration;
    }

    public get isReadRequest(): boolean {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/integrations/postgresql/config";

        const body = JSON.stringify({
            Authentication: {
                Users: (this._configuration.authentication?.users ?? []).map(user => ({
                    Username: user.username,
                    Password: user.password
                }))
            }
        }, null, 0);

        const headers = this._headers()
            .typeAppJson()
            .build();

        return {
            uri,
            method: "POST",
            headers,
            body
        };
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        return this._parseResponseDefaultAsync(bodyStream);
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}
