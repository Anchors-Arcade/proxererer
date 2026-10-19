// Shared Bare server. The leading underscore keeps Vercel from exposing this file as a route.
import { createBareServer } from "@tomphttp/bare-server-node";

const bare = createBareServer("/api/bare/");

export default function handler(req, res) {
	// Vercel keeps the original req.url (e.g. /api/bare/v3/?cache=abc) for file-based routes,
	// so no URL rewriting is needed.
	if (bare.shouldRoute(req)) {
		bare.routeRequest(req, res);
		return;
	}
	res.statusCode = 404;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ error: "not a bare route", url: req.url }));
}
