// Récupère les sources en clair : ECOLE_PASS=... node tools/decrypt.mjs <dossier_sortie>
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { webcrypto as C } from "crypto";
const out = process.argv[2], pass = process.env.ECOLE_PASS;
const b = Buffer.from(readFileSync("app.enc", "utf8"), "base64");
const base = await C.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await C.subtle.deriveKey({ name: "PBKDF2", salt: b.subarray(0, 16), iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
const o = JSON.parse(new TextDecoder().decode(await C.subtle.decrypt({ name: "AES-GCM", iv: b.subarray(16, 28) }, key, b.subarray(28))));
mkdirSync(out + "/js", { recursive: true }); mkdirSync(out + "/css", { recursive: true });
writeFileSync(out + "/css/app.css", o.css);
["lessons", "questions", "annales", "app"].forEach((n, i) => writeFileSync(`${out}/js/${n}.js`, o.js[i]));
writeFileSync(out + "/body.html", o.body);
console.log("ok");
