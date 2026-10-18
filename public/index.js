"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

const scramjetReady = scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
		await navigator.serviceWorker.ready;
		await scramjetReady;
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	try {
		if (location.hostname.endsWith(".vercel.app")) {
			// Vercel can't host WebSockets, so it uses the Bare function at /api/bare/
			const bareUrl = location.origin + "/api/bare/";
			if ((await connection.getTransport()) !== "/baremod/index.mjs") {
				await connection.setTransport("/baremod/index.mjs", [bareUrl]);
			}
		} else {
			// Replit / any Node host: libcurl over the Wisp server built into src/index.js
			const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
			if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
				await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
			}
		}
	} catch (err) {
		error.textContent = "Failed to set up the network transport.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	document.body.appendChild(frame.frame);
	frame.go(url);
});
