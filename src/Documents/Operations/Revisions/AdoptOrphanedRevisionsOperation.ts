import { IOperation, OperationIdResult, OperationResultType } from "../OperationAbstractions.js";
import { IDocumentStore } from "../../IDocumentStore.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { HttpCache } from "../../../Http/HttpCache.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { throwError } from "../../../Exceptions/index.js";
import { RevisionsOperationParameters } from "./RevisionsOperationParameters.js";

export class AdoptOrphanedRevisionsOperation implements IOperation<OperationIdResult> {
    private readonly _parameters: AdoptOrphanedRevisionsParameters;

    constructor()
    constructor(parameters: AdoptOrphanedRevisionsParameters)
    constructor(parameters?: AdoptOrphanedRevisionsParameters) {
        this._parameters = parameters ?? {};
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(store: IDocumentStore, conventions: DocumentConventions, httpCache: HttpCache): RavenCommand<OperationIdResult> {
        return new AdoptOrphanedRevisionsCommand(this._parameters, conventions);
    }
}

export interface AdoptOrphanedRevisionsParameters extends RevisionsOperationParameters {
}

class AdoptOrphanedRevisionsCommand extends RavenCommand<OperationIdResult> {
    private readonly _parameters: AdoptOrphanedRevisionsParameters;
    private readonly _conventions: DocumentConventions;

    constructor(parameters: AdoptOrphanedRevisionsParameters, conventions: DocumentConventions) {
        super();
        this._parameters = parameters;
        this._conventions = conventions;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/revisions/orphaned/adopt";

        const headers = this._headers()
            .typeAppJson()
            .build();

        const body = this._serializer.serialize(this._parameters);

        return {
            method: "POST",
            uri,
            headers,
            body
        };
    }

    get isReadRequest(): boolean {
        return false;
    }

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        return this._parseResponseDefaultAsync(bodyStream);
    }
}
