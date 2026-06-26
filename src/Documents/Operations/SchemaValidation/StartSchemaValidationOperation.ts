import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";
import { throwError } from "../../../Exceptions/index.js";
import { StartSchemaValidationParameters, StartValidateSchemaOperationResult } from "./ValidateSchemaResult.js";

export class StartSchemaValidationOperation implements IMaintenanceOperation<StartValidateSchemaOperationResult> {
    private readonly _parameters: StartSchemaValidationParameters;

    public constructor(parameters: StartSchemaValidationParameters) {
        if (!parameters) {
            throwError("InvalidArgumentException", "Parameters cannot be null");
        }

        if (!parameters.schemaDefinition || !parameters.schemaDefinition.trim()) {
            throwError("InvalidArgumentException", "Schema must be provided.");
        }

        if (!parameters.collection || !parameters.collection.trim()) {
            throwError("InvalidArgumentException", "Collection must be provided.");
        }

        if (parameters.maxErrorMessages != null && parameters.maxErrorMessages < 0) {
            throwError("InvalidArgumentException", "Property MaxErrorMessages must be >= 0.");
        }

        if (parameters.maxDocumentsToValidate != null && parameters.maxDocumentsToValidate <= 0) {
            throwError("InvalidArgumentException", "Property MaxDocumentsToValidate must be > 0.");
        }

        this._parameters = parameters;
    }

    public get resultType(): OperationResultType {
        return "OperationId";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<StartValidateSchemaOperationResult> {
        return new StartSchemaValidationCommand(conventions, this._parameters);
    }
}

export class StartSchemaValidationCommand extends RavenCommand<StartValidateSchemaOperationResult> implements IRaftCommand {
    private readonly _conventions: DocumentConventions;
    private readonly _parameters: StartSchemaValidationParameters;
    private readonly _operationId: number;

    public constructor(conventions: DocumentConventions, parameters: StartSchemaValidationParameters, operationId?: number) {
        super();

        if (!conventions) {
            throwError("InvalidArgumentException", "Conventions cannot be null");
        }

        if (!parameters) {
            throwError("InvalidArgumentException", "Parameters cannot be null");
        }

        this._conventions = conventions;
        this._parameters = parameters;
        this._operationId = operationId;
    }

    public get isReadRequest(): boolean {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        let uri = node.url + "/databases/" + node.database + "/schema-validation/validate";

        if (this._operationId != null) {
            uri += "?operationId=" + this._operationId;
        }

        const body: { [key: string]: unknown } = {
            SchemaDefinition: this._parameters.schemaDefinition,
            Collection: this._parameters.collection
        };

        if (this._parameters.maxErrorMessages != null) {
            body.MaxErrorMessages = this._parameters.maxErrorMessages;
        }
        if (this._parameters.maxDocumentsToValidate != null) {
            body.MaxDocumentsToValidate = this._parameters.maxDocumentsToValidate;
        }
        if (this._parameters.startEtag != null) {
            body.StartEtag = this._parameters.startEtag;
        }

        const headers = this._headers()
            .typeAppJson()
            .build();

        return {
            uri,
            method: "POST",
            headers,
            body: JSON.stringify(body, null, 0)
        };
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        let body: string = null;
        const results = await this._defaultPipeline(_ => body = _)
            .process(bodyStream);
        this.result = results as StartValidateSchemaOperationResult;
        return body;
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}
