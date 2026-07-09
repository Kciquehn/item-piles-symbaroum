import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync("generated/symbaroum-sellable-items.json", "utf8"));

function keyOf(item) {
	return [item.name, item.type, item.cost, item.reference, item.state, item.img].join("|");
}

function csvEscape(value) {
	const text = String(value ?? "");
	return /[",\n\r;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const map = new Map();

for (const item of raw) {
	const key = keyOf(item);
	if (!map.has(key)) {
		map.set(key, {
			...item,
			occurrences: 0,
			modules: new Set(),
			sources: new Set()
		});
	}
	const entry = map.get(key);
	entry.occurrences += 1;
	entry.modules.add(item.moduleTitle);
	entry.sources.add(item.sourceDocument);
	if (!entry.cost && item.cost) entry.cost = item.cost;
	if (!entry.uuid && item.uuid) entry.uuid = item.uuid;
	if (!entry.itemData && item.itemData) entry.itemData = item.itemData;
}

const unique = [...map.values()]
	.map(item => ({
		...item,
		modules: [...item.modules].join(", "),
		sources: [...item.sources]
	}))
	.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

fs.writeFileSync("generated/symbaroum-sellable-items-unique.json", JSON.stringify(unique, null, 2) + "\n");
fs.copyFileSync("generated/symbaroum-sellable-items-unique.json", "src/data/symbaroum-sellable-items.json");

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
	"path",
	"occurrences",
	"modules"
];

const csv = [
	columns.join(";"),
	...unique.map(item => columns.map(column => csvEscape(item[column])).join(";"))
].join("\n");
fs.writeFileSync("generated/symbaroum-sellable-items-unique.csv", csv);

const byType = Object.groupBy(unique, item => item.type);
const markdown = [
	"# Itens vendaveis de Symbaroum",
	"",
	`Total unico: ${unique.length}`,
	"",
	...Object.entries(byType).flatMap(([type, items]) => [
		`## ${type} (${items.length})`,
		"",
		...items.map(item => `- ${item.name}${item.cost ? ` - ${item.cost}` : ""}`),
		""
	])
].join("\n");
fs.writeFileSync("generated/symbaroum-sellable-items-unique.md", markdown);

console.log(JSON.stringify({
	unique: unique.length,
	byType: Object.fromEntries(Object.entries(byType).map(([key, value]) => [key, value.length]))
}, null, 2));
