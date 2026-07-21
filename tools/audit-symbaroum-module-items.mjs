import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ClassicLevel } from "classic-level";

import {
	SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID,
	SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_NAME
} from "../src/data/symbaroum-official-item-categories.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const siblingModules = path.resolve(ROOT, "..");
const defaultModulePaths = [
	path.join(siblingModules, "symbaroum-corerules"),
	path.join(siblingModules, "symbaroum-adventure-collection"),
	path.join(siblingModules, "symbaroum-monstercodex"),
	path.join(siblingModules, "symbaroum-tot-wotw"),
	path.join(os.homedir(), "Documents", "symbaroum-gmg")
];
const MODULE_PATHS = process.argv.slice(2).length ? process.argv.slice(2) : defaultModulePaths;

function normalize(value) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function csvCell(value) {
	const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
	return `"${text.replaceAll('"', '""')}"`;
}

function getFolderPath(folderId, folders) {
	const parts = [];
	const visited = new Set();
	let currentId = folderId;
	while (currentId && !visited.has(currentId)) {
		visited.add(currentId);
		const folder = folders.get(currentId);
		if (!folder) break;
		parts.unshift(folder.name);
		currentId = folder.folder ?? folder.parent ?? null;
	}
	return parts.join(" / ");
}

function getQualities(system) {
	const qualities = system?.qualities;
	if (!qualities || typeof qualities !== "object") return "";
	return Object.entries(qualities)
		.filter(([, value]) => value === true || value?.active === true || value?.value === true)
		.map(([key]) => key)
		.join(" | ");
}

async function readModule(modulePath) {
	const manifest = JSON.parse(await fs.readFile(path.join(modulePath, "module.json"), "utf8"));
	const documents = [];
	const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "item-piles-symbaroum-"));

	try {
		for (const pack of manifest.packs ?? []) {
			const sourcePackPath = pack.path
				? path.join(modulePath, pack.path)
				: path.join(modulePath, "packs", pack.name);
			const packPath = path.join(temporaryRoot, pack.name);
			await fs.cp(sourcePackPath, packPath, {
				recursive: true,
				filter: source => path.basename(source) !== "LOCK"
			});
			const db = new ClassicLevel(packPath, { valueEncoding: "json", readOnly: true });
			await db.open();
			for await (const [key, value] of db.iterator()) {
				documents.push({ key, pack: pack.name, value });
			}
			await db.close();
		}
	} finally {
		await fs.rm(temporaryRoot, { recursive: true, force: true });
	}

	return {
		id: manifest.id,
		title: manifest.title,
		modulePath,
		documents
	};
}

const modules = [];
for (const modulePath of MODULE_PATHS) modules.push(await readModule(modulePath));

const items = [];
const actorItems = [];
for (const module of modules) {
	for (const { pack, value: adventure } of module.documents) {
		const folders = new Map((adventure.folders ?? []).map(folder => [folder._id, folder]));
		for (const item of adventure.items ?? []) {
			const categoriesById = SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID[item._id] ?? [];
			const categoriesByName = SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_NAME[normalize(item.name)] ?? [];
			items.push({
				moduleId: module.id,
				moduleTitle: module.title,
				pack,
				adventureId: adventure._id,
				id: item._id,
				name: item.name,
				type: item.type,
				folder: getFolderPath(item.folder, folders),
				cost: item.system?.cost ?? "",
				reference: item.system?.reference ?? "",
				qualities: getQualities(item.system),
				isArtifact: Boolean(item.system?.isArtifact),
				categories: categoriesById.length ? categoriesById : categoriesByName,
				categoryMatch: categoriesById.length ? "id" : categoriesByName.length ? "name" : ""
			});
		}
		for (const actor of adventure.actors ?? []) {
			for (const item of actor.items ?? []) {
				actorItems.push({
					moduleId: module.id,
					moduleTitle: module.title,
					pack,
					actorId: actor._id,
					actorName: actor.name,
					id: item._id,
					name: item.name,
					type: item.type,
					cost: item.system?.cost ?? "",
					reference: item.system?.reference ?? "",
					qualities: getQualities(item.system),
					isArtifact: Boolean(item.system?.isArtifact)
				});
			}
		}
	}
}

const summary = modules.map(module => ({
	id: module.id,
	title: module.title,
	documentCount: module.documents.length,
	documents: module.documents.map(({ key, pack, value }) => ({
		key,
		pack,
		id: value?._id ?? "",
		name: value?.name ?? "",
		type: value?.type ?? "",
		keys: Object.keys(value ?? {}),
		items: Array.isArray(value?.items) ? value.items.length : 0,
		actors: Array.isArray(value?.actors) ? value.actors.length : 0
	}))
}));

const output = path.join(ROOT, "generated", "symbaroum-official-modules-structure.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

const catalogOutput = path.join(ROOT, "generated", "symbaroum-official-modules-items.json");
await fs.writeFile(catalogOutput, `${JSON.stringify(items, null, 2)}\n`, "utf8");

const csvOutput = path.join(ROOT, "generated", "symbaroum-official-modules-items.csv");
const columns = Object.keys(items[0]);
const csv = [
	columns.map(csvCell).join(","),
	...items.map(item => columns.map(column => csvCell(item[column])).join(","))
].join("\n");
await fs.writeFile(csvOutput, `\uFEFF${csv}\n`, "utf8");

const actorItemsOutput = path.join(ROOT, "generated", "symbaroum-official-modules-actor-items.json");
await fs.writeFile(actorItemsOutput, `${JSON.stringify(actorItems, null, 2)}\n`, "utf8");

const covered = items.filter(item => item.categories.length).length;
const itemsById = new Map();
for (const item of items) {
	const entries = itemsById.get(item.id) ?? [];
	entries.push(item);
	itemsById.set(item.id, entries);
}
const duplicateIds = [...itemsById]
	.filter(([, entries]) => entries.length > 1)
	.map(([id, entries]) => ({ id, entries: entries.map(item => `${item.moduleId}: ${item.name}`) }));

console.log(JSON.stringify({
	modules: summary.map(({ id, title, documents }) => ({
		id,
		title,
		items: documents.reduce((total, document) => total + document.items, 0)
	})),
	totalItems: items.length,
	embeddedActorItems: actorItems.length,
	embeddedActorTradeableItems: actorItems.filter(item => ["armor", "equipment", "weapon", "artifact"].includes(item.type)).length,
	covered,
	uncovered: items.length - covered,
	duplicateIds
}, null, 2));
console.log(`Wrote ${output}`);
console.log(`Wrote ${catalogOutput}`);
console.log(`Wrote ${csvOutput}`);
console.log(`Wrote ${actorItemsOutput}`);
