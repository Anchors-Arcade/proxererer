// DIAGNOSTIC version of api/bare-handler.js
// - every response from this function has the header  x-bare-handler: 1
//   (if the browser's Network tab shows a /api/bare/ response WITHOUT it, Vercel never reached this function)
// - startup errors are returned as JSON instead of crashing
// - every request is logged to Vercel > project > Logs (search "[bare]")

let bare = null;
let initError = null;
try {
	const { createBareServer } = await import("@tomphttp/bare-server-node");
	bare = createBareServer("/api/bare/");
} catch (err) {
	initError = err;
	console.error("[bare] init failed:", err);
}

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Expose-Headers": "*",
	"Access-Control-Max-Age": "7200",
};

function sendJson(res, status, obj) {
	for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
	res.setHeader("x-bare-handler", "1");
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(obj, null, 2));
}

function normalizeUrl(req) {
	const original = req.url || "";
	const q = original.indexOf("?");
	const pathname = q === -1 ? original : original.slice(0, q);
	const search = q === -1 ? "" : original.slice(q);

	if (pathname.startsWith("/api/bare/")) return;
	if (pathname === "/api/bare") {
		req.url = "/api/bare/" + search;
		return;
	}
	const params = new URLSearchParams(search);
	const sub = params.getAll("path").join("/").replace(/^\/+|\/+$/g, "");
	params.delete("path");
	const rest = params.toString();
	req.url = "/api/bare/" + (sub ? sub + "/" : "") + (rest ? "?" + rest : "");
}

export default function handler(req, res) {
	const seenUrl = req.url;
	normalizeUrl(req);
	console.log("[bare]", req.method, seenUrl, "->", req.url);
	res.setHeader("x-bare-handler", "1");
	res.on("finish", () => console.log("[bare] finished", req.method, res.statusCode));

	if (initError) {
		sendJson(res, 500, {
			error: "bare server failed to start",
			message: String(initError && initError.message ? initError.message : initError),
			stack: String(initError && initError.stack ? initError.stack : "").split("\n").slice(0, 6),
		});
		return;
	}

	if (/[?&]debug=1/.test(seenUrl || "")) {
		sendJson(res, 200, { ok: true, method: req.method, seenUrl, routedAs: req.url, shouldRoute: bare.shouldRoute(req), node: process.version });
		return;
	}

	if (req.method === "OPTIONS") {
		for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
		const asked = req.headers["access-control-request-headers"];
		if (asked) res.setHeader("Access-Control-Allow-Headers", asked);
		res.statusCode = 204;
		res.end();
		return;
	}

	try {
		if (bare.shouldRoute(req)) {
			bare.routeRequest(req, res);
			return;
		}
	} catch (err) {
		console.error("[bare] route error:", err);
		sendJson(res, 500, { error: String(err && err.message ? err.message : err) });
		return;
	}

	sendJson(res, 404, { error: "not a bare route", seenUrl, routedAs: req.url });
}
