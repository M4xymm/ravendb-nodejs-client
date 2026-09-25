# C# → TypeScript Pattern Catalogue (RavenDB Client)

Full reference for translating ravendb/ravendb (C# client) patterns to ravendb-nodejs-client (TypeScript).

## Table of Contents
1. [DocumentStore & Session](#1-documentstore--session)
2. [CRUD Operations](#2-crud-operations)
3. [Querying / LINQ → RQL](#3-querying--linq--rql)
4. [Indexes](#4-indexes)
5. [Subscriptions](#5-subscriptions)
6. [Bulk Insert](#6-bulk-insert)
7. [Attachments](#7-attachments)
8. [Counters](#8-counters)
9. [Time Series](#9-time-series)
10. [Changes API](#10-changes-api)
11. [Streaming](#11-streaming)
12. [Conventions & Configuration](#12-conventions--configuration)
13. [HTTP / Commands layer](#13-http--commands-layer)
14. [TypeScript-specific idioms](#14-typescript-specific-idioms)
15. [Structural patterns](#15-structural-patterns)

---

## 1. DocumentStore & Session

```csharp
// C#
var store = new DocumentStore {
    Urls = new[] { "http://localhost:8080" },
    Database = "Northwind"
};
store.Initialize();
```
```typescript
// TypeScript
const store = new DocumentStore("http://localhost:8080", "Northwind");
store.initialize();
```

```csharp
// C# - secure
var store = new DocumentStore {
    Urls = new[] { "https://my.server" },
    Database = "Northwind",
    Certificate = new X509Certificate2("client.pfx", "password")
};
```
```typescript
// TypeScript - secure
const authOptions: IAuthOptions = {
    certificate: fs.readFileSync("client.pfx"),
    type: "pfx",
    password: "password"
};
const store = new DocumentStore(["https://my.server"], "Northwind", authOptions);
```

```csharp
// C# - open session
using (var session = store.OpenAsyncSession()) { ... }
```
```typescript
// TypeScript - no "using", no dispose
const session = store.openSession();
// always call saveChanges() when done
await session.saveChanges();
```

---

## 2. CRUD Operations

```csharp
await session.StoreAsync(entity);
await session.StoreAsync(entity, "custom/id");
await session.SaveChangesAsync();
```
```typescript
await session.store(entity);
await session.store(entity, "custom/id");
await session.saveChanges();
```

```csharp
var user = await session.LoadAsync<User>("users/1-A");
var users = await session.LoadAsync<User>(new[] { "users/1-A", "users/2-A" });
```
```typescript
const user = await session.load<User>("users/1-A");
const users = await session.load<User>(["users/1-A", "users/2-A"]);
```

```csharp
session.Delete(entity);
session.Delete("users/1-A");
```
```typescript
session.delete(entity);
session.delete("users/1-A");
```

```csharp
// Patching
session.Advanced.Patch<User, string>("users/1-A", u => u.Name, "New Name");
```
```typescript
session.advanced.patch<User, string>("users/1-A", "Name", "New Name");
```

```csharp
// Deferred commands
session.Advanced.Defer(new DeleteCommandData("users/1-A", null));
```
```typescript
session.advanced.defer(new DeleteCommandData("users/1-A", null, null));
```

---

## 3. Querying / LINQ → RQL

```csharp
// C# LINQ
var results = await session.Query<User>()
    .Where(u => u.Name == "John")
    .OrderBy(u => u.Age)
    .Take(10)
    .ToListAsync();
```
```typescript
// TypeScript
const results = await session.query<User>({ documentType: User })
    .whereEquals("Name", "John")
    .orderBy("Age")
    .take(10)
    .all();
```

```csharp
// Search
session.Query<User>().Search(u => u.Name, "John*")
```
```typescript
session.query<User>({ documentType: User }).search("Name", "John*")
```

```csharp
// Include
session.Query<Order>().Include(o => o.CompanyId)
```
```typescript
session.query<Order>({ documentType: Order }).include("CompanyId")
```

```csharp
// Statistics
QueryStatistics stats;
var q = session.Query<User>().Statistics(out stats);
```
```typescript
let stats: QueryStatistics | undefined;   // assigned via callback - do not type as bare QueryStatistics under strict mode
const q = session.query<User>({ documentType: User })
    .statistics(s => stats = s);
```

```csharp
// RawQuery
session.Advanced.RawQuery<User>("from Users where Name = $name")
    .AddParameter("name", "John")
```
```typescript
session.advanced.rawQuery<User>("from Users where Name = $name")
    .addParameter("name", "John")
```

```csharp
// DocumentQuery (low-level)
session.Advanced.DocumentQuery<User>()
    .WhereEquals("Name", "John")
```
```typescript
session.advanced.documentQuery<User>({ documentType: User })
    .whereEquals("Name", "John")
```

---

## 4. Indexes

```csharp
// C# - LINQ Map index
public class Orders_ByCompany : AbstractIndexCreationTask<Order>
{
    public Orders_ByCompany()
    {
        Map = orders => from o in orders
                        select new { o.Company, o.Employee };
        
        Index("Company", FieldIndexing.Search);
        Store("Company", FieldStorage.Yes);
    }
}
```
```typescript
// TypeScript - JS Map index
export class Orders_ByCompany extends AbstractJavaScriptIndexCreationTask {
    constructor() {
        super();
        this.map("Orders", o => ({
            Company: o.Company,
            Employee: o.Employee
        }));
        
        this.index("Company", "Search");
        this.store("Company", "Yes");
    }
}
```

```csharp
// C# - MapReduce
public class Orders_CountByEmployee : AbstractIndexCreationTask<Order, Orders_CountByEmployee.Result>
{
    public class Result { public string Employee; public int Count; }
    
    public Orders_CountByEmployee()
    {
        Map = orders => from o in orders
                        select new { o.Employee, Count = 1 };
        Reduce = results => from r in results
                            group r by r.Employee into g
                            select new { Employee = g.Key, Count = g.Sum(x => x.Count) };
    }
}
```
```typescript
// TypeScript - MapReduce
export class Orders_CountByEmployee extends AbstractJavaScriptIndexCreationTask {
    constructor() {
        super();
        this.map("Orders", o => ({ Employee: o.Employee, Count: 1 }));
        this.reduce(results => results
            .groupBy(r => r.Employee)
            .aggregate(g => ({ Employee: g.key, Count: g.values.reduce((c, r) => c + r.Count, 0) }))
        );
    }
}
```

```csharp
// Deploy index
await new MyIndex().ExecuteAsync(store);
```
```typescript
await new MyIndex().execute(store);
```

```csharp
// Query via index
session.Query<User, MyIndex>()
```
```typescript
session.query<User>({ indexName: "MyIndex" })
```

---

## 5. Subscriptions

```csharp
// Create
var name = await store.Subscriptions.CreateAsync<Order>(o => o.Company == "companies/1-A");
```
```typescript
const name = await store.subscriptions.create<Order>({
    query: "from Orders where Company = 'companies/1-A'"
});
```

```csharp
// Worker
var worker = store.Subscriptions.GetSubscriptionWorker<Order>(name);
var task = worker.Run(async batch => {
    foreach (var item in batch.Items) {
        await ProcessOrder(item.Result);
    }
});
await task;
```
```typescript
const worker = store.subscriptions.getSubscriptionWorker<Order>({ subscriptionName: name });
await worker.run(async batch => {
    for (const item of batch.items) {
        await processOrder(item.result);
    }
});
```

```csharp
// With worker options (opening strategy)
store.Subscriptions.GetSubscriptionWorker<Order>(new SubscriptionWorkerOptions(name) {
    Strategy = SubscriptionOpeningStrategy.WaitForFree
});
```
```typescript
store.subscriptions.getSubscriptionWorker<Order>({
    subscriptionName: name,
    strategy: "WaitForFree"
});
```

---

## 6. Bulk Insert

```csharp
using (var bulk = store.BulkInsert()) {
    foreach (var user in users) {
        await bulk.StoreAsync(user);
    }
}
```
```typescript
const bulk = store.bulkInsert();
try {
    for (const user of users) {
        await bulk.store(user);
    }
} finally {
    await bulk.finish();
}
```

```csharp
// With ID
await bulk.StoreAsync(user, "users/custom-id");
```
```typescript
await bulk.store(user, "users/custom-id");
```

---

## 7. Attachments

```csharp
// Store
session.Advanced.Attachments.Store(entity, "photo.png", stream, "image/png");
```
```typescript
session.advanced.attachments.store(entity, "photo.png", readableStream, "image/png");
// Node.js uses Readable streams, not .NET Stream
```

```csharp
// Get
var result = await session.Advanced.Attachments.GetAsync(entity, "photo.png");
using (result.Stream) { /* read */ }
```
```typescript
const result = await session.advanced.attachments.get(entity, "photo.png");
// result.data is a Node.js Readable
result.data.pipe(fs.createWriteStream("photo.png"));
```

```csharp
await session.Advanced.Attachments.ExistsAsync(docId, "photo.png");
var names = await session.Advanced.Attachments.GetNamesAsync(entity);
```
```typescript
await session.advanced.attachments.exists(docId, "photo.png");
const names = await session.advanced.attachments.getNames(entity);
```

---

## 8. Counters

```csharp
session.CountersFor("users/1-A").Increment("Likes", 1);
var count = await session.CountersFor("users/1-A").GetAsync("Likes");
var all = await session.CountersFor("users/1-A").GetAllAsync();
```
```typescript
session.countersFor("users/1-A").increment("Likes", 1);
const count = await session.countersFor("users/1-A").get("Likes");
const all = await session.countersFor("users/1-A").getAll();
```

---

## 9. Time Series

```csharp
session.TimeSeriesFor<HeartRate>("users/1-A")
    .Append(DateTime.UtcNow, new[] { 72.0 }, "tag");

var entries = await session.TimeSeriesFor("users/1-A", "HeartRate")
    .GetAsync(from, to);
```
```typescript
session.timeSeriesFor("users/1-A", "HeartRate")
    .append(new Date(), [72.0], "tag");

const entries = await session.timeSeriesFor("users/1-A", "HeartRate")
    .get(from, to);
```

```csharp
// Typed time series
session.TimeSeriesFor<HeartRate>(entity).Append(entry);
```
```typescript
// TypeScript typed - use string-based API; no exact typed TS equivalent
// Use raw append with values array matching the model fields order
```

---

## 10. Changes API

```csharp
var changes = store.Changes();
var sub = changes.ForDocument("users/1-A")
    .Subscribe(change => Console.WriteLine(change.Type));
```
```typescript
const changes = store.changes();
const sub = changes.forDocument("users/1-A")
    .on("data", change => console.log(change.type))
    .on("error", err => console.error(err));

await changes.ensureConnectedNow();
// cleanup:
sub.off("data", handler);
changes.dispose();
```

```csharp
store.Changes().ForAllDocuments()
store.Changes().ForDocumentsInCollection<User>()
store.Changes().ForIndex("MyIndex")
```
```typescript
changes.forAllDocuments()
changes.forDocumentsInCollection("Users")
changes.forIndex("MyIndex")
```

---

## 11. Streaming

```csharp
var stream = await session.Advanced.StreamAsync(
    session.Query<User>().Where(u => u.Age > 18)
);
while (await stream.MoveNextAsync()) {
    var user = stream.Current.Document;
}
```
```typescript
const stream = await session.advanced.stream(
    session.query<User>({ documentType: User }).whereGreaterThan("Age", 18)
);
for await (const item of stream) {
    const user = item.document;
}
// Or event-based:
stream.on("data", item => console.log(item.document));
stream.on("end", () => console.log("done"));
```

```csharp
// Stream by prefix
await session.Advanced.StreamAsync<User>("users/", streamQueryStats: out var stats)
```
```typescript
let stats: StreamQueryStatistics | undefined;
const stream = await session.advanced.stream<User>("users/", s => stats = s);
```

---

## 12. Conventions & Configuration

```csharp
store.Conventions.MaxNumberOfRequestsPerSession = 30;
store.Conventions.FindCollectionName = type => type.Name + "s";
store.Conventions.IdentityPartsSeparator = '-';
```
```typescript
store.conventions.maxNumberOfRequestsPerSession = 30;
store.conventions.findCollectionNameForObjectLiteral = obj => obj["collection"];
store.conventions.identityPartsSeparator = "-";
```

```csharp
store.Conventions.CustomizeJsonSerializer = s => {
    s.Converters.Add(new MyConverter());
};
```
```typescript
// TypeScript uses DocumentConventions with serialization options
store.conventions.registerEntityType(MyClass);
// For custom serialization use entityFieldNameConvention:
store.conventions.entityFieldNameConvention = "camel";
store.conventions.remoteEntityFieldNameConvention = "pascal";
```

---

## 13. HTTP / Commands Layer

```csharp
// Custom command
public class MyCommand : RavenCommand<MyResult>
{
    public override HttpRequestMessage CreateRequest(JsonOperationContext ctx, ServerNode node, out string url)
    {
        url = $"{node.Url}/databases/{node.Database}/my-endpoint";
        return new HttpRequestMessage(HttpMethod.Get, url);
    }
    
    public override void SetResponse(JsonOperationContext ctx, BlittableJsonReaderObject response, bool fromCache)
    {
        Result = ctx.ReadForMemory(response, "my-result");
    }
}
```
```typescript
// TypeScript equivalent
export class MyCommand extends RavenCommand<MyResult> {
    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = `${node.url}/databases/${node.database}/my-endpoint`;
        return { uri, method: "GET" };
    }
    
    async setResponseAsync(bodyStream: stream.Stream, fromCache: boolean): Promise<string> {
        let body: string | null = null;   // "string = null" fails under strictNullChecks
        const results = await this._defaultPipeline<MyResult>(_ => body = _)
            .process(bodyStream);
        this.result = results;
        return body;
    }
    
    get isReadRequest(): boolean { return true; }
}
```

```csharp
// Execute command
await requestExecutor.ExecuteAsync(command, context);
```
```typescript
await requestExecutor.execute(command);
```

---

## 14. TypeScript-specific Idioms

### Never use `any` - prefer generics or `unknown`
```typescript
// Bad
async load(id: string): Promise<any>
// Good
async load<T extends object>(id: string): Promise<T>
```

### Null handling
```csharp
string? value = GetValue() ?? "default";
```
```typescript
const value: string | null = getValue() ?? "default";
```

### Enums → string literals
```csharp
public enum FieldIndexing { No, Search, Exact, Default }
```
```typescript
type FieldIndexing = "No" | "Search" | "Exact" | "Default";
// RavenDB Node.js client uses string literals throughout, not enums
```

### CancellationToken
- **Drop it** from all method signatures - Node.js uses `AbortController` if needed, but the RavenDB Node.js client generally does not expose cancellation at the API level.

### TimeSpan - check the wire format before choosing a type
A blanket `TimeSpan → number` translation is dangerous. RavenDB's HTTP/JSON contracts frequently expect C#-style TimeSpan **strings** (`"00:00:30"`, `"1.00:00:00"`), and a millisecond number will compile fine but fail (or silently misbehave) against the server.
- For any TimeSpan that is **serialized to the server** (options objects, operation parameters, configuration): find how the nearest existing Node.js type handles it and copy that - often it's a string field, sometimes a number the client converts before sending.
- For purely **in-process** durations (timeouts passed to `setTimeout`, retry delays): `number` in milliseconds is fine.

### Dictionary<K,V> - plain object vs Map
`Map` does not survive `JSON.stringify` (it serializes to `{}`). So:
- Anything that crosses the wire or lives in a document body → plain object / `Record<K, V>`.
- `Map<K, V>` only for in-memory state that is never serialized (caches, lookups).

### DateTime
`DateTime` → `Date` for API surfaces, but note the server stores dates as ISO strings with 7-digit tick precision. The client's date utilities and conventions handle conversion - when a patch touches date serialization, look at how neighboring code formats/parses dates rather than calling `toISOString()` directly.

### Dispose / IDisposable
- No `using` in TypeScript.  
- Sessions: just don't call anything after `saveChanges()`.  
- Streams/workers: call `.dispose()` or close the stream explicitly.
- `store`: call `store.dispose()` on shutdown.

### Event handling vs callbacks
```csharp
store.AfterSaveChanges += (sender, args) => { ... };
```
```typescript
store.on("afterSaveChanges", args => { ... });
// RavenDB Node.js client uses Node EventEmitter pattern
```

### Promise.all for parallel loads
```csharp
var t1 = session.LoadAsync<User>("users/1");
var t2 = session.LoadAsync<Order>("orders/1");
await Task.WhenAll(t1, t2);
```
```typescript
const [user, order] = await Promise.all([
    session.load<User>("users/1"),
    session.load<Order>("orders/1")
]);
```

### Export new public API
When adding new public classes/functions, always add them to `src/index.ts`:
```typescript
export { MyNewClass } from "./Documents/MyNewClass";
```

---

## 15. Structural Patterns

### Generics
C# generics translate directly but use TypeScript syntax and constraints:
```csharp
// C#
public async Task<T> LoadAsync<T>(string id)
```
```typescript
// TypeScript
async load<T extends object>(id: string): Promise<T>
```

### Extension methods
C# extension methods have no TypeScript equivalent. They usually become either instance methods on the relevant class, or static utility functions in a helper module. Check where similar helpers already live in the Node.js repo before deciding.

### Attributes / Annotations
C# attributes (e.g. `[JsonProperty]`) translate to conventions, not decorators. Check `DocumentConventions` for serialization control (`entityFieldNameConvention`, `registerEntityType`, etc.) instead of inventing decorator machinery.

### out / ref parameters
No TypeScript equivalent. Two established patterns in this client:
- Callback assignment: `.statistics(s => stats = s)` (see §3, §11)
- Return an object/tuple instead when designing new API surface
