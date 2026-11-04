// Chiffre l'appli : node tools/build.mjs <dossier_sources>  (mot de passe dans ECOLE_PASS)
// Sortie : app.enc (sel 16 o + iv 12 o + AES-256-GCM), clé = PBKDF2-SHA256 250 000 itérations.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { webcrypto as C } from "crypto";
const src = process.argv[2], pass = process.env.ECOLE_PASS;
if (!src || !pass) { console.error("usage: ECOLE_PASS=... node tools/build.mjs <src>"); process.exit(1); }
// Contrôle qualité : refuse de construire si une question teste une notion absente des leçons
if (existsSync(src + "/tools/check.mjs")) {
  const { check } = await import(new URL("file://" + (src.startsWith("/") ? src : process.cwd() + "/" + src) + "/tools/check.mjs"));
  const r = check(src);
  console.log(`contrôle : ${r.total} questions, ${r.bad.length} notion(s) absente(s) du cours`);
  if (r.bad.length) { r.bad.forEach(b => console.error("  ✗ " + b)); console.error("Build refusé : ajoute la notion dans la leçon, ou relis puis valide (node tools/check.mjs <src> --valider)."); process.exit(1); }
}
const html = readFileSync(src + "/index.html", "utf8");
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("<script src")).trim();
const bundle = JSON.stringify({
  v: 1, body,
  css: readFileSync(src + "/css/app.css", "utf8"),
  js: ["js/lessons.js", "js/questions.js", "js/annales.js", "js/app.js"].map(f => readFileSync(src + "/" + f, "utf8"))
});
// on garde le même sel d'une version à l'autre : le téléphone n'a pas à retaper le mot de passe
const salt = existsSync("app.enc") ? new Uint8Array(Buffer.from(readFileSync("app.enc", "utf8"), "base64").subarray(0, 16)) : C.getRandomValues(new Uint8Array(16)), iv = C.getRandomValues(new Uint8Array(12));
const base = await C.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await C.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await C.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(bundle)));
const out = new Uint8Array(28 + ct.length); out.set(salt); out.set(iv, 16); out.set(ct, 28);
writeFileSync("app.enc", Buffer.from(out).toString("base64"));
console.log("app.enc", out.length, "octets");
