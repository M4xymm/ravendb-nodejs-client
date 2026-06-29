import { IOperation, OperationResultType } from "../OperationAbstractions.js";
import { IDocumentStore } from "../../IDocumentStore.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { HttpCache } from "../../../Http/HttpCache.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { StringUtil } from "../../../Utility/StringUtil.js";
import { throwError } from "../../../Exceptions/index.js";

export class RevertRevisionsByIdOperation implements IOperation<void> {
    private readonly _idToChangeVector: { [id: string]: string };

    constructor(idToChangeVector: { [id: string]: string })
    constructor(id: string, changeVector: string)
    constructor(idToChangeVectorOrId: { [id: string]: string } | string, changeVector?: string) {
        if (typeof idToChangeVectorOrId === "string") {
            const id = idToChangeVectorOrId;
            if (StringUtil.isNullOrEmpty(id)) {
                throwError("InvalidArgumentException", "id cannot be null or empty.");
            }
            if (StringUtil.isNullOrEmpty(changeVector)) {
                throwError("InvalidArgumentException", "cv cannot be null or empty.");
            }
            this._idToChangeVector = { [id]: changeVector };
        } else {
            const idToChangeVector = idToChangeVectorOrId;
            if (!idToChangeVector) {
                throwError("InvalidArgumentException", "idToChangeVector cannot be null.");
            }
            if (Object.keys(idToChangeVector).length === 0) {
                throwError("InvalidArgumentException", "idToChangeVector must contain at least one item.");
            }
            this._idToChangeVector = idToChangeVector;
        }
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(store: IDocumentStore, conventions: DocumentConventions, httpCache: HttpCache): RavenCommand<void> {
        return new RevertRevisionsByIdCommand(this._idToChangeVector);
    }
}

class RevertRevisionsByIdCommand extends RavenCommand<void> {
    private readonly _idToChangeVector: { [id: string]: string };

    constructor(idToChangeVector: { [id: string]: string }) {
        super();
        this._idToChangeVector = idToChangeVector;
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/revisions/revert/docs";

        const body = JSON.stringify({
            IdToChangeVector: this._idToChangeVector
        }, null, 0);

        const headers = this._headers()
            .typeAppJson()
            .build();

        return {
            method: "POST",
            uri,
            headers,
            body
        };
    }
}
