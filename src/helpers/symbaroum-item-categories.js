import CONSTANTS from "../constants/constants.js";
import {
	SYMBAROUM_LEGACY_OFFICIAL_ITEM_CATEGORIES_BY_ID,
	SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID,
	SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_NAME
} from "../data/symbaroum-official-item-categories.js";
import SYMBAROUM_ITEM_GROUPS from "../data/symbaroum-item-groups.js";

const DEFAULT_TRADE_CATEGORY = "scrap-trade-goods";
const TRADEABLE_TYPES = new Set(["armor", "equipment", "weapon", "artifact"]);
const UNIQUE = CONSTANTS.UNIQUE_ITEM_CATEGORY;
const GROUP_LABELS = Object.fromEntries(SYMBAROUM_ITEM_GROUPS.map(group => [group.id, group.name]));

const LEGACY_CATEGORY_MAP = {
	weapons: ["weapons-common"],
	armor: ["armor-common"],
	"alchemy-elixirs": ["elixirs-common"],
	"survival-gear": ["survival-expedition"],
	animals: ["animals-derived"]
};

const CATEGORY_RULES = [
	["weapons-siege", ["arma de cerco", "cerco", "ballista", "balestra", "catapult", "catapulta", "trebuchet", "trabuco", "bateria de misseis", "missile battery"]],
	["weapons-alchemical", ["arma alquimica", "alchemical weapon", "tubo de fogo", "fire tube", "grenada", "grenade", "pote de ruptura", "rupture pot", "explosivo", "explosive"]],
	["elixirs-quality", ["elixir da vida", "strong", "forte", "moderate", "moderado", "amigo espiritual", "spirit friend", "crepuscular", "twilight"]],
	["elixirs-common", ["elixir", "cura herbal", "herbal cure", "antidoto", "antidote", "veneno", "poison", "goma selvagem", "wild chew", "infusao", "infusion", "oleo", "oil", "po ofuscante", "blinding powder", "panacea", "poison candle", "vela de veneno"]],
	["traps-alchemical", ["mina alquimica", "alchemical mine"]],
	["traps-mechanical", ["armadilha mecanica", "mechanical trap", "arapuca", "snare", "armadilha de urso", "bear trap"]],
	["traps", ["armadilha", "trap", "mina", "mine"]],
	["specialist-tools", ["kit de disfarce", "disguise kit", "laboratorio", "laboratory", "cartografo", "cartographer", "kit de cirurgia", "surgery kit", "kit de trapaca", "trickery kit", "ferramenta especializada", "specialized tool"]],
	["musical-instruments", ["instrumento musical", "musical instrument", "tambor", "drum", "flauta", "flute", "violino", "violin", "alaude", "lute", "realejo", "organ", "harpa", "harp", "gaita", "bagpipe"]],
	["instruments-kits", ["kit", "instrumentos", "instruments", "aparato", "apparatus"]],
	["containers", ["recipiente", "container", "aljava", "quiver", "algibeira", "pouch", "mochila", "backpack", "bolsa", "bag", "saco", "sack", "barril", "barrel", "bau", "chest", "caixote", "crate", "caixa", "box", "cantil", "waterskin"]],
	["food", ["comida", "food", "carne", "meat", "racao", "ration", "pao", "bread", "sopa", "soup", "refeicao", "meal", "mingau", "porridge"]],
	["drink", ["bebida", "drink", "vinho", "wine", "cerveja", "beer", "ale", "stout", "caldonegro", "blackbrew", "cha", "tea", "xarope", "syrup"]],
	["tobacco-utensils", ["tabaco", "tobacco", "cachimbo", "pipe", "rape", "snuff", "folha amarga", "bitter leaf", "mascar", "chew"]],
	["clothing", ["roupa", "clothes", "clothing", "vestuario", "shirt", "camisa", "tunic", "tunica", "trapo", "rags", "traje", "garb", "vestido", "dress", "mascara", "mask", "manto", "cloak", "capa", "robe", "bota", "boot", "sapato", "shoe"]],
	["spices", ["especiaria", "spice", "acafrao", "saffron", "canela", "cinnamon", "cravo", "clove", "pimenta", "pepper", "sal", "salt", "gengibre", "ginger"]],
	["monster-trophies", ["trofeu", "trophy", "monstro", "monster", "garra", "claw", "dente", "tooth", "presa", "fang", "orgao", "organ", "glandula", "gland"]],
	["transport-vehicles", ["transporte", "transport", "veiculo", "vehicle", "treno", "sled", "carroca", "cart", "vagao", "wagon", "barco", "boat", "navio", "ship", "carruagem", "carriage"]],
	["animals-derived", ["animal", "montaria", "mount", "cavalo", "horse", "mula", "mule", "cao", "cachorro", "dog", "gado", "livestock", "pele", "skin", "couro", "hide"]],
	["buildings-domains", ["construcao", "building", "dominio", "domain", "fazenda", "farm", "torre", "tower", "fortaleza", "fortress", "castelo", "castle"]],
	["medical", ["medico", "medical", "bandagem", "bandage", "cirurgia", "surgery", "cura", "cure", "antidoto", "antidote"]],
	["survival-expedition", ["corda", "rope", "tenda", "tent", "tocha", "torch", "escalada", "climbing", "luneta", "spyglass", "lanterna", "lantern", "pano", "cloth", "pergaminho", "parchment", "sapato de neve", "snowshoe", "mapa", "map"]],
	["curiosities", ["curiosidade", "curio", "reliquia", "relic", "xadrez", "chess", "colar", "necklace", "perola", "pearl", "antiguidade", "antique", "catalogo", "catalogue"]],
	["artifacts-major", ["artefato maior", "major artifact", "artefato superior", "superior artifact", "lendario", "legendary"]],
	["artifacts-minor", ["artefato menor", "minor artifact", "lesser artifact", "anel", "ring", "selo", "seal", "codice", "codex"]],
	["scrap-trade-goods", ["sucata", "scrap", "detrito", "debris", "fragmento", "fragment", "barra de ouro", "gold bar", "barra de prata", "silver bar", "barra de cobre", "copper bar", "bens de troca", "trade goods", "seda", "silk", "algodao", "cotton", "grao", "grain", "fardo", "bale"]]
];

function normalize(value) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function getProperty(source, path) {
	return foundry.utils.getProperty(source, path);
}

function uniqueCategories(categories) {
	const result = [];
	for (const category of categories.flat().filter(Boolean)) {
		const mapped = LEGACY_CATEGORY_MAP[category] ?? [category];
		for (const entry of mapped) {
			if (!result.includes(entry)) result.push(entry);
		}
	}
	return result;
}

function normalizeCategoryValue(value) {
	if (!value) return [];
	if (Array.isArray(value)) return uniqueCategories(value.map(entry => String(entry).trim()).filter(Boolean));
	if (typeof value === "string") {
		const values = value.split(/[|,;]/).map(entry => entry.trim()).filter(Boolean);
		return uniqueCategories(values);
	}
	return [];
}

function getItemIds(item) {
	const ids = [
		item?.id,
		item?._id,
		item?.itemData?._id,
		item?.itemData?.id,
		item?.documentUuid?.split(".").pop(),
		item?.uuid?.split(".").pop()
	];
	return ids.filter(Boolean);
}

function getItemText(item) {
	const system = item?.system ?? item?.itemData?.system ?? {};
	return normalize([
		item?.name,
		item?.type,
		item?.cost,
		item?.reference,
		item?.sourceDocument,
		item?.modules,
		item?.path,
		system.reference,
		system.quality,
		system.description,
		system.cost,
		Object.entries(system.qualities ?? {}).filter(([, active]) => active).map(([name]) => name).join(" ")
	].filter(Boolean).join(" "));
}

function getExplicitCategories(item) {
	return normalizeCategoryValue(
		getProperty(item, CONSTANTS.FLAGS.CUSTOM_CATEGORY)
		?? getProperty(item, `flags.${CONSTANTS.MODULE_NAME}.item.customCategory`)
		?? item?.customCategory
		?? item?.customCategories
	);
}

function getOfficialCategories(item) {
	for (const id of getItemIds(item)) {
		if (SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID[id]) {
			return SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID[id];
		}
	}
	const name = normalize(item?.name ?? item?.itemData?.name ?? "");
	return SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_NAME[name] ?? [];
}

export function getLegacyOfficialSymbaroumItemCategories(item) {
	for (const id of getItemIds(item)) {
		if (SYMBAROUM_LEGACY_OFFICIAL_ITEM_CATEGORIES_BY_ID[id]) {
			return uniqueCategories(SYMBAROUM_LEGACY_OFFICIAL_ITEM_CATEGORIES_BY_ID[id]);
		}
	}
	return [];
}

function matchesAny(text, terms) {
	return terms.some(term => text.includes(normalize(term)));
}

function isUnique(categories) {
	return categories.includes(UNIQUE);
}

export function getDefaultSymbaroumItemCategories(item) {
	const type = item?.type ?? item?.itemData?.type ?? "";
	const system = item?.system ?? item?.itemData?.system ?? {};
	const text = getItemText(item);
	const officialCategories = getOfficialCategories(item);

	if (officialCategories.length) return uniqueCategories(officialCategories);
	if (!TRADEABLE_TYPES.has(type)) return [UNIQUE];
	if (type === "weapon" && matchesAny(text, ["unarmed", "desarmado", "claws", "garras", "bite", "mordida", "tusks", "presas"])) return [UNIQUE];
	if (type === "weapon") {
		if (matchesAny(text, CATEGORY_RULES.find(([id]) => id === "weapons-siege")[1])) return ["weapons-siege"];
		if (matchesAny(text, CATEGORY_RULES.find(([id]) => id === "weapons-alchemical")[1])) return ["weapons-alchemical"];
		if (matchesAny(text, ["1d10", "1d12", "deep impact", "deepimpact", "precise", "massive", "balanced", "wrecking"])) return ["weapons-quality"];
		return ["weapons-common"];
	}
	if (type === "armor") {
		const categories = [];
		if (matchesAny(text, ["1d8", "reinforced", "hallowed", "retributive", "desecrated"])) categories.push("armor-quality");
		else categories.push("armor-common");
		if (matchesAny(text, CATEGORY_RULES.find(([id]) => id === "clothing")[1])) categories.push("clothing");
		return categories;
	}
	if (type === "artifact" || system.isArtifact) {
		return matchesAny(text, CATEGORY_RULES.find(([id]) => id === "artifacts-major")[1])
			? ["artifacts-major"]
			: ["artifacts-minor"];
	}

	const categories = [];
	for (const [category, terms] of CATEGORY_RULES) {
		if (matchesAny(text, terms)) categories.push(category);
	}

	return uniqueCategories(categories.length ? categories : [DEFAULT_TRADE_CATEGORY]);
}

export function getSymbaroumItemCategories(item) {
	const explicitCategories = getExplicitCategories(item);
	return explicitCategories.length ? explicitCategories : getDefaultSymbaroumItemCategories(item);
}

export function getSymbaroumItemCategory(item) {
	return getSymbaroumItemCategories(item)[0] ?? UNIQUE;
}

export function getSymbaroumItemCategoryLabel(category) {
	if (category === UNIQUE) return "Único/Não Comerciável";
	return GROUP_LABELS[category] ?? category;
}

export function getSymbaroumItemCategoryLabels(categories) {
	return uniqueCategories(normalizeCategoryValue(categories)).map(getSymbaroumItemCategoryLabel);
}

export function isUniqueSymbaroumItem(item) {
	return isUnique(getSymbaroumItemCategories(item));
}

export function itemHasSymbaroumCategory(item, group) {
	const groupCategories = normalizeCategoryValue([
		group?.groupId,
		group?.id,
		group?.name,
		...(Array.isArray(group?.customCategories) ? group.customCategories : [])
	]);
	const itemCategories = getSymbaroumItemCategories(item);
	if (isUnique(itemCategories)) return false;
	return itemCategories.some(category => {
		const normalizedCategory = normalize(category);
		return groupCategories.some(entry => normalize(entry) === normalizedCategory);
	});
}
