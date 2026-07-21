import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UNIQUE = "__unique_not_tradeable__";
const NON_TRADEABLE_TYPES = new Set(["ability", "boon", "burden", "mysticalPower", "ritual", "trait"]);
const TRADEABLE_TYPES = new Set(["armor", "artifact", "equipment", "weapon"]);

function normalize(value) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[’‘]/g, "'")
		.toLowerCase()
		.trim();
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasAny(value, terms) {
	const text = normalize(value);
	return terms.some(term => {
		const normalizedTerm = normalize(term);
		return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, "u").test(text);
	});
}

function parseCostInThaler(value) {
	const text = normalize(value).replace(",", ".");
	const match = text.match(/\d+(?:\.\d+)?/u);
	if (!match) return null;
	const amount = Number(match[0]);
	if (hasAny(text, ["orteg", "ortega"])) return amount / 100;
	if (hasAny(text, ["shilling", "xelim"])) return amount / 10;
	return amount;
}

function unique(values) {
	return [...new Set(values.flat().filter(Boolean))];
}

function add(categories, ...entries) {
	for (const entry of entries.flat()) {
		if (entry && !categories.includes(entry)) categories.push(entry);
	}
}

function itemText(item) {
	return [item.name, item.folder, item.reference, item.qualities].filter(Boolean).join(" ");
}

function classifyArtifact(item) {
	const categories = [];
	const text = itemText(item);
	const cost = parseCostInThaler(item.cost);
	const isMinor = normalize(item.folder).includes("apg - artifacts")
		&& !hasAny(item.name, ["the soul stone", "pedra da alma"]);
	add(categories, isMinor || (cost !== null && cost < 50) ? "artifacts-minor" : "artifacts-major");

	if (isMinor && hasAny(item.name, ["mask", "mascara", "coin", "moeda", "medallion", "medalhao", "crown", "coroa"])) {
		add(categories, "curiosities");
	}
	if (isMinor && hasAny(text, ["rune staff", "staff foot", "staff head", "cajado runico"])) {
		add(categories, "weapons-quality");
	}
	return categories;
}

function isNaturalWeapon(item, origin) {
	const name = normalize(item.name);
	if (hasAny(name, ["crow's beak", "bico de corvo"])) return false;
	if (hasAny(name, ["unarmed", "desarmado", "bite", "mordida", "tusk", "tusks", "presa", "presas", "claw", "claws", "garra", "garras", "fang", "fangs", "antler", "antlers", "beak", "bico", "horns", "chifres", "hoof", "hoofs", "casco", "cascos", "mandible", "mandibles", "mandibula", "mandibulas", "paw", "paws", "pata", "patas", "tentacle", "tentacles", "tentaculo", "tentaculos", "stinger", "sting", "ferrao", "head butt", "headbutt", "fists", "punhos", "talon", "talons", "garras de ave"])) {
		return !hasAny(name, ["battle claw", "garra de batalha"]);
	}
	if (origin !== "actor") return false;
	return hasAny(name, ["branches", "ramos", "thorns", "espinhos", "spikes", "espinhos", "bone nails", "unhas de osso", "ice nails", "unhas de gelo", "mycelial threads", "fios miceliais", "horror slash", "golpe de horror", "dead touch", "touch of death", "toque da morte", "burning embrace", "abraco ardente", "drowning", "afogamento", "strangling", "estrangulamento", "sweeping attack", "ataque de varredura", "kiss", "beijo"]);
}

function classifyWeapon(item, origin) {
	const text = itemText(item);
	if (isNaturalWeapon(item, origin)) return [UNIQUE];
	if (hasAny(text, ["shield", "escudo", "buckler", "broquel"])) return ["armor-common"];
	if (hasAny(text, ["ballista", "balestra", "catapult", "catapulta", "trebuchet", "trabuco", "missile battery", "bateria de misseis"])) {
		return ["weapons-siege"];
	}
	if (hasAny(text, ["alchemical firetube", "tubo de fogo alquimico", "alchemical grenade", "granada alquimica", "breaching pot", "breaching", "pote de ruptura", "portable firetube"])) {
		return ["weapons-alchemical"];
	}

	const cost = parseCostInThaler(item.cost);
	const isQuality = (cost !== null && cost >= 20)
		|| hasAny(text, ["deepimpact", "deep impact", "precise", "massive", "balanced", "wrecking", "reinforced", "hallowed", "master crafted", "mastercrafted", "glowing", "blessed", "burning", "holy"]);
	return [isQuality ? "weapons-quality" : "weapons-common"];
}

function isConventionalArmor(name) {
	return hasAny(name, ["armor", "armour", "armadura", "chainmail", "chain mail", "cota de malha", "leather", "couro", "plate", "placas", "scalemail", "brunea", "cuirass", "couraca", "robe", "toga", "gown", "veste", "cloak", "manto", "apron", "avental", "harness", "arreio", "jacket", "jaqueta"]);
}

function isNaturalArmor(name) {
	return hasAny(name, ["skin", "pele", "hide", "couro", "fur", "pelo", "pelt", "pelagem", "bark", "casca", "carapace", "carapaca", "chitin", "quitina", "shell", "concha", "scales", "escamas", "feathers", "penas", "flesh", "carne", "body", "corpo", "aura"]);
}

function classifyArmor(item, origin) {
	const text = itemText(item);
	if (origin === "actor" && (isNaturalArmor(item.name) || !isConventionalArmor(item.name))) return [UNIQUE];

	const categories = [];
	const cost = parseCostInThaler(item.cost);
	const isQuality = (cost !== null && cost >= 50)
		|| hasAny(text, ["1d8", "reinforced", "hallowed", "retributive", "desecrated", "heavy armor", "armadura pesada", "full plate", "armadura completa", "fortified", "mastercrafted", "master crafted", "glowing", "smouldering", "templar"]);
	add(categories, isQuality ? "armor-quality" : "armor-common");
	if (hasAny(item.name, ["robe", "toga", "gown", "veste", "cloak", "manto", "silk", "seda", "garb", "traje"])) add(categories, "clothing");
	if (hasAny(item.name, ["animal skin", "wolf skin", "pele de animal", "pele de lobo"])) add(categories, "animals-derived");
	return categories;
}

function classifyElixir(item) {
	const categories = [];
	const text = itemText(item);
	const cost = parseCostInThaler(item.cost);
	const isQuality = hasAny(text, ["moderate", "moderado", "strong", "forte", "elixir of life", "elixir da vida", "spirit friend", "amigo espiritual", "twilight", "crepuscular", "concentrated magic", "magia concentrada", "truth serum", "soro da verdade", "terato's draught", "pocao de terato"])
		|| (cost !== null && cost >= 5 && !hasAny(text, ["weak purple sap", "seiva purpura fraca", "weak poison", "veneno fraco"]));
	add(categories, isQuality ? "elixirs-quality" : "elixirs-common");

	if (hasAny(text, ["cure", "cura", "antidote", "antidoto", "healing", "medicinal", "blue drops", "gotas azuis", "smelling salts", "sais aromaticos", "truth serum", "soro da verdade"])) add(categories, "medical");
	if (hasAny(text, ["choking spores", "esporos sufocantes", "ghost candle", "vela fantasma", "spore bomb", "bomba de esporos", "wraith dust", "po espectral", "flash powder", "po luminoso", "smoke bomb", "bomba de fumaca", "thunder ball", "bola trovejante"])) add(categories, "weapons-alchemical");
	if (hasAny(text, ["waybread", "pao de viagem"])) add(categories, "food", "survival-expedition");
	if (hasAny(text, ["dream snuff", "rape dos sonhos"])) add(categories, "tobacco-utensils");
	return categories;
}

function classifyFoodAndDrink(item) {
	const categories = [];
	const name = item.name;
	const isDrink = hasAny(name, ["bottle", "garrafa", "tea", "cha", "table ale", "cerveja", "tankard", "caneca"]);
	add(categories, isDrink ? "drink" : "food");
	if (hasAny(name, ["bottle", "garrafa", "tankard", "caneca", "one box", "uma caixa", "one jar", "um jarro", "can of", "lata de"])) add(categories, "containers");
	return categories;
}

function classifyEquipment(item, origin) {
	const categories = [];
	const text = itemText(item);
	const folder = normalize(item.folder);

	if (folder.includes("alchemical elixirs") || hasAny(text, [
		"elixir", "herbal cure", "cura herbal", "antidote", "antidoto", "poison", "veneno", "purple sap", "seiva purpura",
		"drone dew", "orvalho do zangao", "drone spores", "esporos de zangao", "fire dye", "tintura de fogo", "holy water", "agua benta",
		"homunculus", "revealing light", "luz reveladora", "shadow tint", "tintura sombria", "stun bolt", "virote atordoante",
		"transforming draught", "pocao transformadora", "twilight tincture", "tintura crepuscular", "spirit friend", "amigo espiritual",
		"wild chew", "goma selvagem", "truth serum", "soro da verdade", "terato's draught", "pixie dust", "po de pixie",
		"blue drops", "gotas azuis", "dream snuff", "rape dos sonhos", "elemental essence", "essencia elemental", "smelling salts", "sais aromaticos"
	])) return classifyElixir(item);

	if (folder.includes("food and drink")) return classifyFoodAndDrink(item);
	if (hasAny(text, ["aged sherry", "xerez envelhecido", "jug of liquor", "jarro de bebida", "wine skin", "odre de vinho"])) {
		add(categories, "drink");
		if (hasAny(text, ["jug", "jarro", "skin", "odre"])) add(categories, "containers");
	}
	if (hasAny(text, ["ritual book", "livro de ritual", "ritual codex", "codice de ritual", "ritual seal", "selo ritual", "tome of ceremonies", "tomo de cerimonias", "protective amulet", "amuleto protetor", "rattle wand", "varinha chocalho"])) add(categories, "artifacts-minor");
	if (hasAny(text, ["book of prayers", "livro de oracoes", "holy symbol", "simbolo sagrado", "sun symbol", "simbolo solar", "templar symbol", "simbolo templario", "the lightbringer", "o portador da luz", "note book", "caderno", "scrolls", "pergaminhos", "lucky charm", "amuleto da sorte", "the inner nature of the abomination", "a natureza interior da abominacao"])) add(categories, "curiosities");
	if (hasAny(text, ["flagellant whip", "chicote de flagelante", "garrotes", "garrotes de estrangulamento"])) add(categories, "weapons-common");
	if (hasAny(text, ["firetube charges", "cargas de tubo de fogo", "suicide ampoule", "ampola suicida"])) add(categories, "weapons-alchemical");
	if (hasAny(text, ["crude alchemical equipment", "equipamento alquimico rudimentar"])) add(categories, "specialist-tools", "instruments-kits");

	if (hasAny(text, ["alchemical mine", "mina alquimica"])) add(categories, "traps", "traps-alchemical", "weapons-alchemical");
	if (hasAny(text, ["mechanical trap", "armadilha mecanica", "bear trap", "armadilha de urso", "snares", "arapucas", "hunting traps", "armadilhas de caca"])) add(categories, "traps", "traps-mechanical");

	if (hasAny(text, ["arrow", "arrows", "bolt", "flecha", "flechas", "virote"])) add(categories, "weapons-common");
	if (hasAny(text, ["buckler", "broquel", "shield", "escudo"])) add(categories, "armor-common");
	if (hasAny(text, ["grappling hook", "gancho", "rope cutter", "cortador de corda"])) add(categories, "survival-expedition");

	if (hasAny(text, ["artifact catalogue", "catalogo de artefatos", "bestiary", "bestiario", "poison manual", "manual de venenos", "trapper's manual", "manual do armadilheiro", "hour glass", "ampulheta", "pocket mirror", "espelho de bolso", "jewelry", "joias", "trinkets", "bugigangas", "lucky dice", "dados da sorte", "dice set", "conjunto de dados"])) add(categories, "curiosities");
	if (hasAny(text, ["catalogue", "catalogo", "bestiary", "bestiario", "manual", "artisan tool", "ferramenta de artesao", "cartographer", "cartografo", "cheating kit", "kit de trapaca", "disguise kit", "kit de disfarce", "excavation tools", "ferramentas de escavacao", "field laboratory", "laboratorio de campo", "field library", "biblioteca de campo", "field smithy", "ferraria de campo", "surgeon's instrument", "instrumento de cirurgiao", "forgery kit", "kit de falsificacao", "lockpicks", "gazuas", "interrogation tools", "ferramentas de interrogatorio"])) add(categories, "specialist-tools");
	if (hasAny(text, [" kit", "kit ", "instruments", "instrumentos", "laboratory", "laboratorio", "library", "biblioteca", "smithy", "ferraria", "excavation tools", "artisan tool", "lockpicks", "gazuas"])) add(categories, "instruments-kits");
	if (hasAny(text, ["bandages", "bandagens", "surgeon", "cirurgiao", "smelling salts", "sais aromaticos"])) add(categories, "medical");

	if (hasAny(text, ["bagpipe", "gaita", "horn", "corneta", "drum", "tambor", "flute", "flauta", "fiddle", "violino", "hurdy-gurdy", "realejo", "lute", "alaude", "mouth harp", "harpa de boca", "spinet", "espineta", "brass bell", "sino de bronze", "whistle", "apito"])) add(categories, "musical-instruments");
	if (hasAny(text, ["backpack", "mochila", "knapsack", "bornal", "barrel", "barril", "basket", "cesta", "belt pouch", "bolsa de cinto", "clay pitcher", "jarro", "coin purse", "porta-moedas", "decorated box", "caixa decorada", "glass vial", "frasco de vidro", "large chest", "bau grande", "small chest", "bau pequeno", "quiver", "aljava", "sack", "saco", "tankard", "caneca", "waterskin", "cantil", "snuff box", "caixa de rape", "one box", "uma caixa", "one roll", "um rolo", "one earthen", "vasilha", "one bar", "uma barra"])) add(categories, "containers");

	if (hasAny(text, ["bedroll", "saco de dormir", "blanket", "cobertor", "climbing", "escalada", "field equipment", "equipamento de campo", "firewood", "lenha", "fishing", "pesca", "flint and steel", "pederneira", "grappling hook", "gancho", "ladder", "escada", "lamp oil", "oleo de lampiao", "lantern", "lanterna", "rope", "corda", "snow shoes", "sapatos de neve", "spy glass", "luneta", "tent", "tenda", "torch", "tocha", "wax candle", "vela de cera", "whetstone", "pedra de amolar", "map of", "mapa de", "parchment", "pergaminho", "cooking pan", "panela"])) add(categories, "survival-expedition");

	if (hasAny(text, ["garb", "traje", "boots", "botas", "cap", "gorro", "cloak", "manto", "coat", "casaco", "dress", "vestido", "gown", "veste", "hat", "chapeu", "mask", "mascara", "pants", "calcas", "robe", "toga", "scarf", "cachecol", "shirt", "camisa", "skirt", "saia", "torn rags", "trapos", "tunic", "tunica", "clothes", "roupas", "headband", "faixa", "multicolored robes", "feather veil", "veu de penas"])) add(categories, "clothing");

	if (hasAny(text, ["cardamom", "cardamomo", "cinnamon", "canela", "clove", "cravo", "cumin", "cominho", "ginger", "gengibre", "mint", "menta", "saffron", "acafrao", "spices", "especiarias", "salt", "sal", "sugar", "acucar", "turmeric", "curcuma", "vegetable oil", "oleo vegetal", "vinegar", "vinagre"])) add(categories, "spices");
	if (hasAny(text, ["tobacco", "tabaco", "pipe", "cachimbo", "snuff", "rape", "longbottom leaf", "folha longbottom", "smoke tube", "tubo de fumaca"])) add(categories, "tobacco-utensils");

	if (hasAny(text, ["monster trophy", "trofeu de monstro"])) add(categories, "monster-trophies");
	if (hasAny(text, ["horse", "cavalo", "mule", "mula", "livestock", "gado", "animal skin", "pele de animal", "wolf skin", "pele de lobo"])) add(categories, "animals-derived");
	if (hasAny(text, ["cart", "carroca", "wagon", "vagao", "boat", "barco", "ship", "navio", "sled", "treno", "carriage", "carruagem", "vehicle", "veiculo"])) add(categories, "transport-vehicles");
	if (hasAny(text, ["building", "construcao", "domain", "dominio", "farm", "fazenda", "tower", "torre", "fortress", "fortaleza", "castle", "castelo"])) add(categories, "buildings-domains");

	if (hasAny(text, ["copper", "cobre", "cotton", "algodao", "gold", "ouro", "grain", "grao", "iron", "ferro", "silk", "seda", "silver", "prata", "tar", "alcatrao", "chain", "corrente", "cooking pan", "panela", "crayons", "gizes", "hammer", "martelo", "ink and feather", "tinta e pena", "mining pick", "picareta", "needle and thread", "agulha e linha", "paper", "papel", "scythe", "foice", "shovel", "pa", "sledgehammer", "marreta", "soap", "sabao", "straw doll", "bone crafts", "silver coins", "moedas de prata", "arm bracelet", "bracelete", "necklace", "colar"])) add(categories, "scrap-trade-goods");

	if (categories.length) return categories;
	if (origin === "actor" && !String(item.cost ?? "").trim()) return [UNIQUE];
	return ["scrap-trade-goods"];
}

function classify(item, origin) {
	if (NON_TRADEABLE_TYPES.has(item.type) || !TRADEABLE_TYPES.has(item.type)) return [UNIQUE];
	if (item.type === "artifact" || item.isArtifact || normalize(item.folder).includes("artifacts")) return classifyArtifact(item);
	if (item.type === "weapon") return classifyWeapon(item, origin);
	if (item.type === "armor") return classifyArmor(item, origin);
	return classifyEquipment(item, origin);
}

function sameCategories(left, right) {
	return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function jsString(value) {
	return JSON.stringify(value, null, 0);
}

function csvCell(value) {
	const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
	return `"${text.replaceAll('"', '""')}"`;
}

function parseCsv(content) {
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let index = 0; index < content.length; index += 1) {
		const character = content[index];
		if (quoted) {
			if (character === '"' && content[index + 1] === '"') {
				cell += '"';
				index += 1;
			} else if (character === '"') {
				quoted = false;
			} else {
				cell += character;
			}
		} else if (character === '"') {
			quoted = true;
		} else if (character === ",") {
			row.push(cell);
			cell = "";
		} else if (character === "\n") {
			row.push(cell.replace(/\r$/u, ""));
			rows.push(row);
			row = [];
			cell = "";
		} else {
			cell += character;
		}
	}
	if (cell || row.length) {
		row.push(cell);
		rows.push(row);
	}
	const [headers = [], ...values] = rows;
	headers[0] = headers[0]?.replace(/^\uFEFF/u, "");
	return values
		.filter(columns => columns.some(Boolean))
		.map(columns => Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? ""])));
}

const catalog = JSON.parse(await fs.readFile(path.join(ROOT, "generated", "symbaroum-official-modules-items.json"), "utf8"));
const actorItems = JSON.parse(await fs.readFile(path.join(ROOT, "generated", "symbaroum-official-modules-actor-items.json"), "utf8"));
const records = [
	...catalog.map(item => ({ ...item, origin: "catalog" })),
	...actorItems.map(item => ({ ...item, origin: "actor", folder: "" }))
];

const catalogCategoriesByNameAndType = new Map();
for (const item of catalog) {
	const categories = classify(item, "catalog");
	catalogCategoriesByNameAndType.set(`${item.type}|${normalize(item.name)}`, categories);
}

const classified = records.map(item => {
	const catalogCategories = catalogCategoriesByNameAndType.get(`${item.type}|${normalize(item.name)}`);
	const isNaturalActorItem = item.origin === "actor"
		&& ((item.type === "weapon" && isNaturalWeapon(item, "actor")) || (item.type === "armor" && isNaturalArmor(item.name)));
	const categories = item.origin === "actor" && catalogCategories && !isNaturalActorItem
		? catalogCategories
		: classify(item, item.origin);
	return { ...item, categories: unique(categories) };
});

const byId = new Map();
const conflictingIds = new Set();
for (const item of classified) {
	if (item.origin === "actor" && NON_TRADEABLE_TYPES.has(item.type)) continue;
	if (!item.id || conflictingIds.has(item.id)) continue;
	const current = byId.get(item.id);
	if (current && !sameCategories(current, item.categories)) {
		byId.delete(item.id);
		conflictingIds.add(item.id);
		continue;
	}
	byId.set(item.id, item.categories);
}

const nameCandidates = new Map();
const legacyById = new Map();
function addNameCandidate(name, categories, priority) {
	const normalizedName = normalize(name);
	if (!normalizedName) return;
	const current = nameCandidates.get(normalizedName);
	if (!current || priority > current.priority) {
		nameCandidates.set(normalizedName, { categories, priority, conflicting: false });
		return;
	}
	if (priority === current.priority && !sameCategories(current.categories, categories)) {
		current.conflicting = true;
	}
}

const translatedNamesPath = path.join(ROOT, "generated", "symbaroum-official-item-categories-audit.csv");
try {
	const translatedRows = parseCsv(await fs.readFile(translatedNamesPath, "utf8"));
	for (const row of translatedRows) {
		const categories = byId.get(row.ID);
		if (!categories) continue;
		const legacyCategories = unique(String(row.Categorias ?? "")
			.split(",")
			.map(category => category.trim())
			.filter(Boolean));
		if (legacyCategories.length && !sameCategories(legacyCategories, categories)) {
			legacyById.set(row.ID, legacyCategories);
		}
		for (const name of [row["Nome EN"], row["Nome PT-BR"]]) {
			addNameCandidate(name, categories, 2);
		}
	}
} catch (error) {
	if (error?.code !== "ENOENT") throw error;
}
for (const item of classified.filter(item => item.origin === "catalog")) {
	addNameCandidate(item.name, item.categories, 2);
}
for (const item of classified.filter(item => item.origin === "actor")) {
	if (NON_TRADEABLE_TYPES.has(item.type)) continue;
	addNameCandidate(item.name, item.categories, 1);
}
const conflictingNames = [...nameCandidates]
	.filter(([, candidate]) => candidate.conflicting)
	.map(([name]) => name)
	.sort();
const byName = new Map([...nameCandidates]
	.filter(([, candidate]) => !candidate.conflicting)
	.map(([name, candidate]) => [name, candidate.categories]));

const sourceLines = [
	"// Generated from the official Symbaroum Adventure packs listed in tools/audit-symbaroum-module-items.mjs.",
	"// Run the audit tool and tools/generate-symbaroum-module-categories.mjs after updating official modules.",
	"",
	"export const SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID = {"
];
for (const [id, categories] of [...byId].sort(([left], [right]) => left.localeCompare(right))) {
	sourceLines.push(`\t${jsString(id)}: ${jsString(categories)},`);
}
sourceLines.push("};", "", "export const SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_NAME = {");
for (const [name, categories] of [...byName].sort(([left], [right]) => left.localeCompare(right))) {
	sourceLines.push(`\t${jsString(name)}: ${jsString(categories)},`);
}
sourceLines.push("};", "", "export const SYMBAROUM_LEGACY_OFFICIAL_ITEM_CATEGORIES_BY_ID = {");
for (const [id, categories] of [...legacyById].sort(([left], [right]) => left.localeCompare(right))) {
	sourceLines.push(`\t${jsString(id)}: ${jsString(categories)},`);
}
sourceLines.push("};", "");

const sourceOutput = path.join(ROOT, "src", "data", "symbaroum-official-item-categories.js");
await fs.writeFile(sourceOutput, sourceLines.join("\n"), "utf8");

const auditColumns = ["origin", "moduleId", "actorName", "id", "name", "type", "folder", "cost", "categories"];
const auditCsv = [
	auditColumns.map(csvCell).join(","),
	...classified.map(item => auditColumns.map(column => csvCell(item[column])).join(","))
].join("\n");
const auditOutput = path.join(ROOT, "generated", "symbaroum-official-module-categories-audit.csv");
await fs.writeFile(auditOutput, `\uFEFF${auditCsv}\n`, "utf8");

const categoryCounts = {};
for (const item of classified) {
	for (const category of item.categories) categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
}
const summary = {
	catalogItems: catalog.length,
	embeddedActorItems: actorItems.length,
	totalItemInstances: classified.length,
	byId: byId.size,
	byName: byName.size,
	legacyMigrations: legacyById.size,
	conflictingIds: [...conflictingIds].sort(),
	conflictingNames,
	uncategorized: classified.filter(item => !item.categories.length).length,
	categoryCounts: Object.fromEntries(Object.entries(categoryCounts).sort(([left], [right]) => left.localeCompare(right)))
};
const summaryOutput = path.join(ROOT, "generated", "symbaroum-official-module-categories-summary.json");
await fs.writeFile(summaryOutput, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${sourceOutput}`);
console.log(`Wrote ${auditOutput}`);
console.log(`Wrote ${summaryOutput}`);
