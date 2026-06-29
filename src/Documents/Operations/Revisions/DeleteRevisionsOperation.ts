import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { StringUtil } from "../../../Utility/StringUtil.js";
import { throwError } from "../../../Exceptions/index.js";

export interface DeleteRevisionsResult {
    totalDeletes: number;
}

export interface DeleteRevisionsParameters {
    documentIds: string[];
    removeForceCreatedRevisions?: boolean;
    revisionsChangeVectors?: string[];
    from?: string;
    to?: string;
}

export class DeleteRevisionsOperation implements IMaintenanceOperation<DeleteRevisionsResult> {
    private readonly _parameters: DeleteRevisionsParameters;

    constructor(documentIds: string[], removeForceCreatedRevisions?: boolean)
    constructor(documentId: string, removeForceCreatedRevisions?: boolean)
    constructor(documentIds: string[], from: string, to: string, removeForceCreatedRevisions?: boolean)
    constructor(documentId: string, from: string, to: string, removeForceCreatedRevisions?: boolean)
    constructor(documentId: string, revisionsChangeVectors: string[], removeForceCreatedRevisions?: boolean)
    constructor(
        documentIdOrIds: string | string[],
        arg2?: boolean | string | string[],
        arg3?: string | boolean,
        arg4?: boolean) {

        const documentIds = Array.isArray(documentIdOrIds) ? documentIdOrIds : [ documentIdOrIds ];

        let parameters: DeleteRevisionsParameters;

        if (typeof arg2 === "string" && typeof arg3 === "string") {
            // (documentId(s), from, to, removeForceCreatedRevisions?)
            parameters = {
                documentIds,
                from: arg2,
                to: arg3,
                removeForceCreatedRevisions: arg4 ?? false
            };
        } else if (Array.isArray(arg2)) {
            // (documentId, revisionsChangeVectors, removeForceCreatedRevisions?)
            parameters = {
                documentIds,
                revisionsChangeVectors: arg2,
                removeForceCreatedRevisions: (typeof arg3 === "boolean" ? arg3 : false)
            };
        } else {
            // (documentId(s), removeForceCreatedRevisions?)
            parameters = {
                documentIds,
                removeForceCreatedRevisions: (typeof arg2 === "boolean" ? arg2 : false)
            };
        }

        DeleteRevisionsOperation._validate(parameters);
        this._parameters = parameters;
    }

    private static _validate(parameters: DeleteRevisionsParameters): void {
        if (!parameters.documentIds || parameters.documentIds.length === 0) {
            throwError("InvalidArgumentException", "request 'DocumentIds' cannot be null or empty.");
        }

        for (const id of parameters.documentIds) {
            if (StringUtil.isNullOrEmpty(id)) {
                throwError("InvalidArgumentException", "request 'DocumentIds' contains null or empty ids.");
            }
        }

        if (!parameters.revisionsChangeVectors || parameters.revisionsChangeVectors.length === 0) {
            if (parameters.from != null && parameters.to != null && parameters.from >= parameters.to) {
                throwError("InvalidArgumentException", "'To' must be greater than 'From'.");
            }
        } else {
            if (parameters.documentIds.length > 1) {
                throwError("InvalidArgumentException",
                    "The request must include exactly one document ID when deleting specific revisions by their change-vectors.");
            }

            if (parameters.from != null) {
                throwError("InvalidArgumentException",
                    "request 'From' cannot have a value when deleting specific revisions by their change-vectors.");
            }

            if (parameters.to != null) {
                throwError("InvalidArgumentException",
                    "request 'To' cannot have a value when deleting specific revisions by their change-vectors.");
            }

            for (const cv of parameters.revisionsChangeVectors) {
                if (StringUtil.isNullOrEmpty(cv)) {
                    throwError("InvalidArgumentException",
                        "request 'RevisionsChangeVectors' contains null or empty change-vectors.");
                }
            }
        }
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<DeleteRevisionsResult> {
        return new DeleteRevisionsCommand(this._parameters);
    }
}

export class DeleteRevisionsCommand extends RavenCommand<DeleteRevisionsResult> {
    private readonly _parameters: DeleteRevisionsParameters;

    public constructor(parameters: DeleteRevisionsParameters) {
        super();
        this._parameters = parameters;
    }

    public get isReadRequest() {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/revisions";

        const body = JSON.stringify({
            DocumentIds: this._parameters.documentIds,
            RemoveForceCreatedRevisions: this._parameters.removeForceCreatedRevisions,
            RevisionsChangeVectors: this._parameters.revisionsChangeVectors,
            From: this._parameters.from,
            To: this._parameters.to
        }, null, 0);

        const headers = this._headers()
            .typeAppJson()
            .build();

        return {
            uri,
            method: "DELETE",
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
}
