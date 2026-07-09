import CONSTANTS from "../constants/constants.js";

const DEFAULT_TRADE_CATEGORY = "scrap-trade-goods";
const TRADEABLE_TYPES = new Set(["armor", "equipment", "weapon", "artifact"]);

const CATEGORY_RULES = [
	["weapons-siege", [
		"arma de cerco", "cerco", "ballista", "balestra", "catapult", "catapulta", "trebuchet", "trabuco", "bateria de misseis", "missile battery"
	]],
	["weapons-alchemical", [
		"arma alquimica", "alchemical weapon", "tubo de fogo", "fire tube", "grenada", "grenade", "pote de ruptura", "rupture pot", "explosivo", "explosive"
	]],
	["alchemy-elixirs", [
		"elixir", "cura herbal", "herbal cure", "antidoto", "antidote", "veneno", "poison", "goma selvagem", "wild chew", "amigo espiritual", "spiritual friend", "infusao", "infusion", "mutagen", "mutagenico", "oleo", "oil", "po ofuscante", "blinding powder", "panacea", "poison candle", "vela de veneno"
	]],
	["traps", [
		"armadilha", "trap", "arapuca", "snare", "armadilha de urso", "bear trap", "mina", "mine"
	]],
	["specialist-tools", [
		"kit de disfarce", "disguise kit", "laboratorio", "laboratory", "instrumentos de cartografo", "cartographer", "kit de cirurgia", "surgery kit", "kit de trapaca", "trickery kit", "ferramenta especializada", "specialized tool"
	]],
	["musical-instruments", [
		"instrumento musical", "musical instrument", "tambor", "drum", "flauta", "flute", "violino", "violin", "alaude", "lute", "realejo", "organ", "harpa", "harp"
	]],
	["instruments-kits", [
		"kit", "instrumentos", "instruments", "aparato", "apparatus"
	]],
	["containers", [
		"recipiente", "container", "aljava", "quiver", "algibeira", "pouch", "mochila", "backpack", "bolsa", "bag", "saco", "sack", "barril", "barrel", "bau", "chest", "caixote", "crate", "caixa", "box"
	]],
	["food", [
		"comida", "food", "carne", "meat", "racao", "ration", "pao", "bread", "sopa", "soup", "refeicao", "meal"
	]],
	["drink", [
		"bebida", "drink", "vinho", "wine", "cerveja", "beer", "ale", "stout", "caldonegro", "blackbrew", "cha", "tea", "xarope", "syrup"
	]],
	["tobacco-utensils", [
		"tabaco", "tobacco", "cachimbo", "pipe", "rape", "snuff", "folha amarga", "bitter leaf", "mascar", "chew"
	]],
	["clothing", [
		"roupa", "clothes", "clothing", "vestuario", "shirt", "camisa", "tunic", "tunica", "trapo", "rags", "traje", "garb", "vestido", "dress", "mascara", "mask", "manto", "cloak", "capa", "robe", "bota", "boot", "sapato", "shoe"
	]],
	["spices", [
		"especiaria", "spice", "acafrao", "saffron", "canela", "cinnamon", "cravo", "clove", "pimenta", "pepper", "sal", "salt"
	]],
	["monster-trophies", [
		"trofeu", "trophy", "monstro", "monster", "garra", "claw", "dente", "tooth", "presa", "fang", "couro", "hide", "pele", "pelt", "orgao", "organ", "glandula", "gland"
	]],
	["transport-vehicles", [
		"transporte", "transport", "veiculo", "vehicle", "treno", "sled", "carroca", "cart", "vagao", "wagon", "barco", "boat", "navio", "ship", "carruagem", "carriage"
	]],
	["animals", [
		"animal", "montaria", "mount", "cavalo", "horse", "mula", "mule", "cao", "cachorro", "dog", "gado", "livestock"
	]],
	["survival-gear", [
		"corda", "rope", "tenda", "tent", "tocha", "torch", "escalada", "climbing", "luneta", "spyglass", "lanterna", "lantern", "pano", "cloth", "pergaminho", "parchment", "sapato de neve", "snowshoe", "mapa", "map"
	]],
	["curiosities", [
		"curiosidade", "curio", "reliquia", "relic", "xadrez", "chess", "colar", "necklace", "perola", "pearl", "antiguidade", "antique"
	]],
	["artifacts-major", [
		"artefato maior", "major artifact", "artefato superior", "superior artifact", "lendario", "legendary"
	]],
	["artifacts-minor", [
		"artefato menor", "minor artifact", "lesser artifact", "anel", "ring", "selo", "seal", "codice", "codex"
	]],
	["scrap-trade-goods", [
		"sucata", "scrap", "detrito", "debris", "fragmento", "fragment", "barra de ouro", "gold bar", "barra de prata", "silver bar", "barra de cobre", "copper bar", "bens de troca", "trade goods", "seda", "silk", "algodao", "cotton", "grao", "grain", "fardo", "bale"
	]]
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

function getItemText(item) {
	const system = item?.system ?? item?.itemData?.system ?? {};
	return normalize([
		item?.name,
		item?.type,
		item?.cost,
		item?.reference,
		item?.sourceDocument,
		item?.modules,
		system.reference,
		system.quality,
		system.description,
		system.cost
	].filter(Boolean).join(" "));
}

function getExplicitCategory(item) {
	return getProperty(item, CONSTANTS.FLAGS.CUSTOM_CATEGORY)
		?? getProperty(item, `flags.${CONSTANTS.MODULE_NAME}.item.customCategory`)
		?? "";
}

function matchesAny(text, terms) {
	return terms.some(term => text.includes(normalize(term)));
}

export function getDefaultSymbaroumItemCategory(item) {
	const type = item?.type ?? item?.itemData?.type ?? "";
	const system = item?.system ?? item?.itemData?.system ?? {};
	const text = getItemText(item);

	if (!TRADEABLE_TYPES.has(type)) return CONSTANTS.UNIQUE_ITEM_CATEGORY;
	if (type === "weapon") {
		if (matchesAny(text, CATEGORY_RULES.find(([id]) => id === "weapons-siege")[1])) return "weapons-siege";
		if (matchesAny(text, CATEGORY_RULES.find(([id]) => id === "weapons-alchemical")[1])) return "weapons-alchemical";
		return "weapons";
	}
	if (type === "armor") {
		if (matchesAny(text, CATEGORY_RULES.find(([id]) => id === "clothing")[1])) return "clothing";
		return "armor";
	}
	if (type === "artifact" || system.isArtifact) {
		return matchesAny(text, CATEGORY_RULES.find(([id]) => id === "artifacts-major")[1])
			? "artifacts-major"
			: "artifacts-minor";
	}

	for (const [category, terms] of CATEGORY_RULES) {
		if (matchesAny(text, terms)) return category;
	}

	return DEFAULT_TRADE_CATEGORY;
}

export function getSymbaroumItemCategory(item) {
	return getExplicitCategory(item) || getDefaultSymbaroumItemCategory(item);
}
