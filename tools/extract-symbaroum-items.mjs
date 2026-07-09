import fs from "node:fs";
import path from "node:path";
import { ClassicLevel } from "classic-level";

const sources = [
	{
		moduleId: "symbaroum-corerules",
		title: "Symbaroum Core Rulebook",
		root: "C:/Users/kcire/AppData/Local/FoundryVTT/Data/modules/symbaroum-corerules"
	},
	{
		moduleId: "symbaroum-adventure-collection",
		title: "Symbaroum Adventure Collection",
		root: "C:/Users/kcire/AppData/Local/FoundryVTT/Data/modules/symbaroum-adventure-collection"
	},
	{
		moduleId: "symbaroum-monstercodex",
		title: "Symbaroum Monster Codex",
		root: "C:/Users/kcire/AppData/Local/FoundryVTT/Data/modules/symbaroum-monstercodex"
	},
	{
		moduleId: "symbaroum-tot-wotw",
		title: "Symbaroum - Thistle Hold - Wrath of the Warden",
		root: "C:/Users/kcire/AppData/Local/FoundryVTT/Data/modules/symbaroum-tot-wotw"
	},
	{
		moduleId: "symbaroum-gmg",
		title: "Symbaroum Game Master's Guide",
		root: "C:/Users/kcire/Desktop/symbaroum-gmg"
	}
];

const sellableTypes = new Set(["weapon", "armor", "equipment", "artifact"]);
const seen = new Set();
const items = [];
const stats = {};

function safeJsonParse(value) {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

function isPlainObject(value) {
	return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeCost(cost) {
	if (cost == null) return "";
	if (typeof cost === "object") return cost.value ?? cost.total ?? cost.cost ?? JSON.stringify(cost);
	return String(cost).trim();
}

function collectItems(value, context, trail = []) {
	if (!value) return;
	if (Array.isArray(value)) {
		value.forEach((entry, index) => collectItems(entry, context, trail.concat(index)));
		return;
	}
	if (!isPlainObject(value)) return;

	const documentName = value.documentName ?? value.documentType ?? value._stats?.systemId;
	const type = value.type;
	const hasItemShape = typeof value.name === "string" && typeof type === "string" && isPlainObject(value.system);
	if ((value.documentName === "Item" || documentName === "Item" || hasItemShape) && type) {
		const cost = normalizeCost(value.system?.cost);
		const quantity = value.system?.number ?? "";
		const sellable = sellableTypes.has(type) || cost !== "";
		if (sellable) {
			const id = value._id ?? value.id ?? "";
			const key = [
				context.moduleId,
				context.packName,
				id,
				value.name,
				type,
				cost,
				value.img ?? ""
			].join("|");
			if (!seen.has(key)) {
				seen.add(key);
				items.push({
					moduleId: context.moduleId,
					moduleTitle: context.moduleTitle,
					packName: context.packName,
					packLabel: context.packLabel,
					sourceDocument: context.sourceDocument,
					id,
					name: value.name,
					type,
					cost,
					quantity,
					reference: value.system?.reference ?? "",
					state: value.system?.state ?? "",
					img: value.img ?? "",
					uuid: id ? `Compendium.${context.moduleId}.${context.packName}.${id}` : "",
					path: trail.join("."),
					itemData: value
				});
			}
		}
	}

	for (const [key, child] of Object.entries(value)) {
		if (key === "img" || key === "description") continue;
		if (typeof child === "object" && child !== null) collectItems(child, context, trail.concat(key));
	}
}

async function readPack(source, pack) {
	const packPath = pack.path
		? path.join(source.root, pack.path)
		: path.join(source.root, "packs", pack.name);
	const tempPackPath = path.join(
		process.env.TEMP ?? process.env.TMP ?? "C:/Windows/Temp",
		`item-piles-symbaroum-${source.moduleId}-${pack.name}-${Date.now()}`
	);
	fs.cpSync(packPath, tempPackPath, {
		recursive: true,
		filter: sourcePath => path.basename(sourcePath) !== "LOCK"
	});
	const db = new ClassicLevel(tempPackPath, { valueEncoding: "utf8" });
	await db.open();
	let count = 0;
	for await (const [, rawValue] of db.iterator()) {
		const doc = safeJsonParse(rawValue);
		if (!doc) continue;
		count += 1;
		collectItems(doc, {
			moduleId: source.moduleId,
			moduleTitle: source.title,
			packName: pack.name,
			packLabel: pack.label ?? pack.name,
			sourceDocument: doc.name ?? doc._id ?? ""
		});
	}
	await db.close();
	fs.rmSync(tempPackPath, { recursive: true, force: true });
	return count;
}

function csvEscape(value) {
	const text = String(value ?? "");
	return /[",\n\r;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeOutputs() {
	const outDir = path.resolve("generated");
	fs.mkdirSync(outDir, { recursive: true });
	items.sort((a, b) =>
		a.moduleTitle.localeCompare(b.moduleTitle)
		|| a.type.localeCompare(b.type)
		|| a.name.localeCompare(b.name)
	);
	fs.writeFileSync(path.join(outDir, "symbaroum-sellable-items.json"), JSON.stringify(items, null, 2));
	const columns = [
		"moduleTitle",
		"packLabel",
		"sourceDocument",
		"name",
		"type",
		"cost",
		"quantity",
		"reference",
		"state",
		"img",
		"uuid",
		"path"
	];
	const csv = [
		columns.join(";"),
		...items.map(item => columns.map(column => csvEscape(item[column])).join(";"))
	].join("\n");
	fs.writeFileSync(path.join(outDir, "symbaroum-sellable-items.csv"), csv);

	const byModule = Object.groupBy(items, item => item.moduleTitle);
	const byType = Object.groupBy(items, item => item.type);
	fs.writeFileSync(path.join(outDir, "symbaroum-sellable-items-summary.json"), JSON.stringify({
		total: items.length,
		byModule: Object.fromEntries(Object.entries(byModule).map(([key, value]) => [key, value.length])),
		byType: Object.fromEntries(Object.entries(byType).map(([key, value]) => [key, value.length])),
		packsRead: stats
	}, null, 2));
}

for (const source of sources) {
	const manifest = JSON.parse(fs.readFileSync(path.join(source.root, "module.json"), "utf8"));
	stats[source.moduleId] = {};
	for (const pack of manifest.packs ?? []) {
		stats[source.moduleId][pack.name] = await readPack(source, pack);
	}
}

writeOutputs();
console.log(`Extracted ${items.length} sellable items.`);
