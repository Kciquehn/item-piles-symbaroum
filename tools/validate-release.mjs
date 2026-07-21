import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const fail = message => {
	throw new Error(`Release validation failed: ${message}`);
};

const manifest = readJson("module.json");
const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const expectedId = "item-piles-symbaroum";
const expectedRepository = "https://github.com/Kciquehn/item-piles-symbaroum";
const expectedManifest = `${expectedRepository}/releases/latest/download/module.json`;
const expectedDownload = `${expectedRepository}/releases/latest/download/${expectedId}.zip`;

if (manifest.id !== expectedId) fail(`module id must be ${expectedId}`);
if (manifest.version !== packageJson.version) fail("module.json and package.json versions differ");
if (manifest.version !== packageLock.version) fail("module.json and package-lock.json versions differ");
if (packageLock.packages?.[""]?.version !== manifest.version) fail("root package-lock entry has a different version");
if (manifest.url !== expectedRepository) fail("repository URL is not canonical");
if (manifest.manifest !== expectedManifest) fail("manifest URL is not the stable release URL");
if (manifest.download !== expectedDownload) fail("download URL is not the stable release asset URL");
if (String(manifest.compatibility?.minimum) !== "13") fail("Foundry VTT minimum must remain 13");
if (String(manifest.compatibility?.verified) !== "14") fail("Foundry VTT verified version must remain 14");

const requiredPaths = [
	"LICENSE",
	"README.md",
	"SECURITY.md",
	"changelog.md",
	...manifest.esmodules,
	...manifest.styles,
	...manifest.languages.map(language => language.path),
	...manifest.packs.map(pack => pack.path)
];

for (const relativePath of requiredPaths) {
	if (path.isAbsolute(relativePath)) fail(`absolute package path is not allowed: ${relativePath}`);
	if (!fs.existsSync(path.join(root, relativePath))) fail(`missing required path: ${relativePath}`);
}

for (const pack of manifest.packs) {
	if (pack.type === "Item" && pack.system !== "symbaroum") {
		fail(`Item pack ${pack.name} must declare the symbaroum system`);
	}
}

const relationshipIds = new Set(manifest.relationships?.requires?.map(relationship => relationship.id));
for (const required of ["symbaroum", "socketlib", "lib-wrapper"]) {
	if (!relationshipIds.has(required)) fail(`missing required relationship: ${required}`);
}

console.log(`Release metadata is valid for ${manifest.id} v${manifest.version}.`);
