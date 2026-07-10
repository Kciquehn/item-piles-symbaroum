import csv
import json
import re
import unicodedata
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = Path(r"C:\Users\kcire\Desktop\symbaroum-itens-completos.xlsx")
SHEET = "Foundry Todos"
UNIQUE = "__unique_not_tradeable__"


def clean(value):
	if pd.isna(value):
		return ""
	return str(value).strip()


def norm(value):
	text = unicodedata.normalize("NFD", clean(value))
	text = "".join(char for char in text if unicodedata.category(char) != "Mn")
	return text.lower()


def words(*values):
	return " ".join(norm(value) for value in values if clean(value))


def has(text, *terms):
	text = norm(text)
	for term in terms:
		term = norm(term)
		if not term:
			continue
		if len(term) <= 4 and re.fullmatch(r"[a-z0-9]+", term):
			if re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", text):
				return True
			continue
		if term in text:
			return True
	return False


def cost_value(value):
	text = norm(value).replace(",", ".")
	match = re.search(r"\d+(?:\.\d+)?", text)
	if not match:
		return None
	number = float(match.group(0))
	if "orteg" in text:
		return number / 10
	if "shilling" in text or "xelim" in text:
		return number / 2
	return number


def groups_for(row):
	item_type = clean(row.get("Tipo"))
	folder = clean(row.get("Pasta/Tabela Foundry"))
	name_en = clean(row.get("Nome EN"))
	name_pt = clean(row.get("Nome PT-BR"))
	cost = clean(row.get("Custo EN")) or clean(row.get("Custo PT-BR"))
	reference = clean(row.get("Referência"))
	qualities = clean(row.get("Qualidades"))
	base_damage = clean(row.get("Dano base"))
	protection = clean(row.get("Proteção base"))
	text = words(folder, name_en, name_pt, cost, reference, qualities, base_damage, protection)
	cost_taler = cost_value(cost)

	if item_type in {"ability", "boon", "burden", "mysticalPower", "ritual", "trait"}:
		return [UNIQUE]
	if has(text, "abilities", "boons/burdens", "boons burdens", "powers", "rituals", "traits", "monstrous traits", "system special traits"):
		return [UNIQUE]
	if has(text, "unarmed") and item_type == "weapon":
		return [UNIQUE]

	categories = []

	def add(*entries):
		for entry in entries:
			if entry not in categories:
				categories.append(entry)

	if item_type == "weapon":
		if has(text, "isartifact", "artifact", "artefato") and not cost:
			add("artifacts-major")
		elif has(text, "siege", "cerco", "catapult", "catapulta", "trebuchet", "trabuco", "ballista", "balestra"):
			add("weapons-siege")
		elif has(text, "alchemical", "alquim", "fire tube", "tubo de fogo", "grenade", "granada", "rupture pot"):
			add("weapons-alchemical")
		elif has(text, "shield", "escudo", "buckler", "broquel"):
			add("armor-common")
		elif cost_taler is not None and cost_taler >= 20:
			add("weapons-quality")
		elif has(text, "1d10", "1d12", "deepimpact", "deep impact", "precise", "massive", "wrecking", "balanced", "hallowed", "desecrated", "flaming", "poison", "mystical"):
			add("weapons-quality")
		else:
			add("weapons-common")
		return categories or ["weapons-common"]

	if item_type == "armor":
		if has(text, "skin", "fur", "hide", "pele", "couro") and not cost:
			add("animals-derived")
			return categories
		if cost_taler is not None and cost_taler >= 50:
			add("armor-quality")
		elif has(text, "1d8", "reinforced", "hallowed", "retributive", "desecrated", "full plate", "armadura completa"):
			add("armor-quality")
		else:
			add("armor-common")
		if has(text, "robe", "gown", "silk", "manto", "toga", "seda"):
			add("clothing")
		return categories

	if has(folder, "Alchemical Elixirs"):
		if has(text, "strong", "forte", "moderate", "moderado", "life", "vida", "spirit friend", "amigo espiritual", "twilight", "crepuscular") or (cost_taler is not None and cost_taler >= 5):
			add("elixirs-quality")
		else:
			add("elixirs-common")
		if has(text, "cure", "cura", "antidote", "antidoto", "bandage", "medicine"):
			add("medical")
		if has(text, "bomb", "bomba", "spores", "esporos", "powder", "po", "candle", "vela"):
			add("weapons-alchemical")
		if has(text, "waybread", "pao de viagem"):
			add("food", "survival-expedition")
		return categories

	if has(folder, "Artifacts"):
		if has(text, "soul stone", "pedra da alma", "sun stone", "pedra do sol", "serpent staff", "mummified hand", "water of dusk", "worldcleaver") or (cost_taler is not None and cost_taler >= 50):
			add("artifacts-major")
		else:
			add("artifacts-minor")
		if has(text, "mask", "mascara", "catalogue", "catalogo", "medallion", "medalhao", "coin", "moeda"):
			add("curiosities")
		if has(text, "staff", "cajado"):
			add("weapons-quality")
		return categories

	if has(text, "alchemical mine", "mina alquimica"):
		add("traps", "traps-alchemical", "weapons-alchemical")
	elif has(text, "mechanical trap", "armadilha mecanica", "snares", "armadilha de caca", "bear trap", "armadilha de urso"):
		add("traps", "traps-mechanical")

	if has(text, "arrow", "arrows", "bolt", "flecha", "virote"):
		add("weapons-common")
	if has(text, "artifact catalogue", "catalogo de artefatos", "bestiary", "bestiario", "manual"):
		add("curiosities", "specialist-tools")
	if has(text, "cartographer", "cartografo", "disguise", "disfarce", "laboratory", "laboratorio", "smithy", "ferraria", "library", "biblioteca", "forgery", "falsificacao", "cheating", "trapaca", "excavation", "escavacao", "lockpick", "gazua"):
		add("specialist-tools", "instruments-kits")
	if has(text, "surgeon", "surgery", "cirurg", "bandage", "bandagem"):
		add("medical", "specialist-tools")
	if has(text, "kit", "instrument kit"):
		add("instruments-kits")
	if has(text, "bagpipe", "gaita", "fiddle", "violino", "hurdy", "lute", "alaude", "harp", "harpa", "flute", "flauta", "drum", "tambor", "horn", "corneta", "spinet", "espineta"):
		add("musical-instruments")
	if has(text, "backpack", "mochila", "barrel", "barril", "basket", "cesta", "pouch", "bolsa", "box", "caixa", "chest", "bau", "quiver", "aljava", "sack", "saco", "waterskin", "cantil", "vial", "frasco", "pitcher", "jarro", "tankard", "caneca", "bottle", "garrafa"):
		add("containers")
	if has(text, "rope", "corda", "climbing", "escalada", "tent", "tenda", "torch", "tocha", "lantern", "lanterna", "bedroll", "saco de dormir", "blanket", "cobertor", "field equipment", "equipamento de acampar", "grappling hook", "arpao", "ladder", "escada", "spy glass", "luneta", "snow shoes", "sapatos de neve", "flint", "pederneira", "firewood", "lenha", "fishing", "pesca", "whetstone", "amolar"):
		add("survival-expedition")
	if has(text, "shirt", "camisa", "garb", "traje", "clothes", "roupa", "boots", "botas", "cloak", "capa", "coat", "casaco", "dress", "vestido", "gown", "beca", "hat", "chapeu", "mask", "mascara", "pants", "calca", "robe", "tunic", "tunica", "skirt", "saia", "scarf", "cachecol", "rags", "trapos"):
		add("clothing")
	if has(text, "food", "comida", "meat", "carne", "bread", "pao", "soup", "sopa", "porridge", "mingau", "pie", "torta", "fish", "peixe", "ration", "racao", "meal", "refeicao", "butter", "manteiga", "cheese", "queijo", "waybread"):
		add("food")
	if has(text, "drink", "bebida", "wine", "vinho", "beer", "cerveja", "ale", "mead", "hidromel", "tea", "cha", "milk", "leite", "cider", "syrup", "xarope", "blot", "luden"):
		add("drink")
	if has(text, "tobacco", "tabaco", "pipe", "cachimbo", "snuff", "rape", "leaf", "folha"):
		add("tobacco-utensils")
	if has(text, "cardamom", "cardamomo", "cinnamon", "canela", "clove", "cravo", "cumin", "cominho", "ginger", "gengibre", "mint", "menta", "saffron", "acafrao", "salt", "sal", "spices", "especiarias", "sugar", "acucar", "turmeric", "curcuma", "pepper", "pimenta", "vinegar", "vinagre", "oil", "oleo"):
		add("spices")
	if has(text, "gold", "ouro", "silver", "prata", "copper", "cobre", "iron", "ferro", "cotton", "algodao", "silk", "seda", "grain", "grao", "tar", "alcatrao", "fabric", "tecido", "roll", "rolo", "bar", "barra", "sack", "saca", "chain", "corrente", "soap", "sabao", "paper", "papel", "parchment", "pergaminho", "needle", "agulha", "thread", "linha", "hammer", "martelo", "shovel", "pa", "scythe", "foice", "sledgehammer", "marreta"):
		add("scrap-trade-goods")
	if has(text, "trophy", "trofeu", "monster", "monstro", "claw", "garra", "tooth", "dente", "fang", "presa", "organ", "orgao", "gland", "glandula"):
		add("monster-trophies")
	if has(text, "animal", "horse", "cavalo", "mule", "mula", "dog", "cao", "skin", "pele", "fur", "pelo", "hide", "couro"):
		add("animals-derived")
	if has(text, "cart", "carroca", "wagon", "vagao", "boat", "barco", "ship", "navio", "sled", "treno", "vehicle", "veiculo", "carriage", "carruagem"):
		add("transport-vehicles")
	if has(text, "building", "construcao", "domain", "dominio", "farm", "fazenda", "tower", "torre", "fortress", "fortaleza", "castle", "castelo"):
		add("buildings-domains")

	if not categories and item_type == "equipment":
		add("scrap-trade-goods")

	return categories or [UNIQUE]


def js_string(value):
	return json.dumps(value, ensure_ascii=False)


def main():
	df = pd.read_excel(WORKBOOK, sheet_name=SHEET)
	by_id = {}
	by_name = {}
	audit_rows = []

	for _, row in df.iterrows():
		item_id = clean(row.get("ID"))
		name_en = clean(row.get("Nome EN"))
		name_pt = clean(row.get("Nome PT-BR"))
		categories = groups_for(row)
		if item_id:
			by_id[item_id] = categories
		for name in {name_en, name_pt}:
			key = norm(name)
			if key:
				by_name.setdefault(key, categories)
		audit_rows.append({
			"ID": item_id,
			"Nome EN": name_en,
			"Nome PT-BR": name_pt,
			"Tipo": clean(row.get("Tipo")),
			"Pasta/Tabela Foundry": clean(row.get("Pasta/Tabela Foundry")),
			"Custo": clean(row.get("Custo EN")) or clean(row.get("Custo PT-BR")),
			"Categorias": ", ".join(categories),
		})

	out = ROOT / "src" / "data" / "symbaroum-official-item-categories.js"
	lines = [
		"// Generated from C:/Users/kcire/Desktop/symbaroum-itens-completos.xlsx.",
		"// Run tools/generate-symbaroum-official-categories.py after updating the workbook.",
		"",
		"export const SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_ID = {",
	]
	for key in sorted(by_id):
		lines.append(f"\t{js_string(key)}: {js_string(by_id[key])},")
	lines.extend(["};", "", "export const SYMBAROUM_OFFICIAL_ITEM_CATEGORIES_BY_NAME = {"])
	for key in sorted(by_name):
		lines.append(f"\t{js_string(key)}: {js_string(by_name[key])},")
	lines.extend(["};", ""])
	out.write_text("\n".join(lines), encoding="utf-8")

	generated = ROOT / "generated"
	generated.mkdir(exist_ok=True)
	audit = generated / "symbaroum-official-item-categories-audit.csv"
	with audit.open("w", encoding="utf-8-sig", newline="") as handle:
		writer = csv.DictWriter(handle, fieldnames=list(audit_rows[0]))
		writer.writeheader()
		writer.writerows(audit_rows)

	counts = {}
	for categories in by_id.values():
		for category in categories:
			counts[category] = counts.get(category, 0) + 1
	print(f"Wrote {out}")
	print(f"Wrote {audit}")
	print(json.dumps(dict(sorted(counts.items())), ensure_ascii=False, indent=2))


if __name__ == "__main__":
	main()
