// Shared Bare server. The leading underscore keeps Vercel from exposing this file as a route.
import { createBareServer } from "@tomphttp/bare-server-node";

const bare = createBareServer("/api/bare/");

export default function handler(req, res) {
	// Vercel may strip the trailing slash from the path; Bare's routes need it (/api/bare/v3/).
	const q = (req.url || "").indexOf("?");
	const pathname = q === -1 ? req.url : req.url.slice(0, q);
	const search = q === -1 ? "" : req.url.slice(q);
	if (!pathname.endsWith("/")) req.url = pathname + "/" + search;

	if (bare.shouldRoute(req)) {
		bare.routeRequest(req, res);
		return;
	}
	res.statusCode = 404;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ error: "not a bare route", url: req.url }));
}
