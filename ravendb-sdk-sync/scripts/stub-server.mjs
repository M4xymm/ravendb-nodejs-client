import { createServer } from "node:http";

export async function startStubServer(handler) {
    const requests = [];
    const server = createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const request = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString("utf8") };
        requests.push(request);
        const { status = 200, json = {} } = await handler(request);
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(json));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    return {
        url: `http://127.0.0.1:${server.address().port}`,
        requests,
        close: () => new Promise((resolve) => {
            server.closeAllConnections();
            server.close(resolve);
        }),
    };
}
