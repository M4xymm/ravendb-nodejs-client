import assert from "node:assert";
import { describe, it, afterEach } from "node:test";
import { DocumentStore } from "../../../src/Documents/DocumentStore.js";

describe("AbstractDocumentQuery - range queries with falsy values", function () {

    let store: InstanceType<typeof DocumentStore>;

    afterEach(() => {
        store?.dispose();
    });

    function createStore() {
        store = new DocumentStore("http://localhost:9999", "TestDB");
        store.conventions.findCollectionNameForObjectLiteral = () => "test";
        store.initialize();
        return store;
    }

    it("whereBetween preserves 0 as a valid boundary value", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereBetween("age", 0, 100);
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, 0,
            "start value 0 should be preserved, not replaced with wildcard '*'");
        assert.strictEqual(iq.queryParameters.p1, 100);
    });

    it("whereGreaterThan preserves 0 as a valid value", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereGreaterThan("count", 0);
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, 0,
            "value 0 should be preserved, not replaced with wildcard '*'");
    });

    it("whereLessThan preserves 0 as a valid value", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereLessThan("count", 0);
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, 0,
            "value 0 should be preserved, not replaced with 'NULL'");
    });

    it("whereGreaterThanOrEqual preserves 0 as a valid value", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereGreaterThanOrEqual("count", 0);
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, 0,
            "value 0 should be preserved, not replaced with wildcard '*'");
    });

    it("whereLessThanOrEqual preserves 0 as a valid value", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereLessThanOrEqual("count", 0);
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, 0,
            "value 0 should be preserved, not replaced with 'NULL'");
    });

    it("whereBetween with null start uses wildcard", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereBetween("age", null, 100);
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, "*",
            "null start should become wildcard '*'");
    });

    it("whereBetween with empty string preserves it as a value", function () {
        const s = createStore().openSession();

        const q = s.query({ collection: "users" }).whereBetween("name", "", "Z");
        const iq = q.getIndexQuery();

        assert.strictEqual(iq.queryParameters.p0, "",
            "empty string should be preserved, not replaced with wildcard '*'");
    });
});
