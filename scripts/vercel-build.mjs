// Copies the Scramjet / libcurl / bare-mux dist files into public/
// so Vercel can serve everything as static files.
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { createRequire } from "node:module";
import { dirname } from "node:path";
const require = createRequire(import.meta.url);
const baremodPath = dirname(dirname(require.resolve("@mercuryworkshop/bare-as-module3"))) + "/dist";

const pub = fileURLToPath(new URL("../public/", import.meta.url));
const targets = { scram: scramjetPath, libcurl: libcurlPath, baremux: baremuxPath, baremod: baremodPath };

for (const [name, src] of Object.entries(targets)) {
	const dest = pub + name;
	rmSync(dest, { recursive: true, force: true });
	mkdirSync(dest, { recursive: true });
	cpSync(src, dest, { recursive: true });
	console.log(`copied ${name} <- ${src}`);
}
