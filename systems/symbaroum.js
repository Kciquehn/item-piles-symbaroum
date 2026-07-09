export default {

	"VERSION": "1.0.3",

	// The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
	"ACTOR_CLASS_TYPE": "monster",

	// The item class type is the type of item that will be used for the default loot item
	"ITEM_CLASS_LOOT_TYPE": "equipment",

	// The item class type is the type of item that will be used for the default weapon item
	"ITEM_CLASS_WEAPON_TYPE": "weapon",

	// The item class type is the type of item that will be used for the default equipment item
	"ITEM_CLASS_EQUIPMENT_TYPE": "equipment",

	// The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
	"ITEM_QUANTITY_ATTRIBUTE": "system.number",

	// The item price attribute is the path to the attribute on each item that determine how much it costs
	"ITEM_PRICE_ATTRIBUTE": "system.cost",

	// Item types and the filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
	"ITEM_FILTERS": [
		{
			"path": "type",
			"filters": "ability,boon,burden,mysticalPower,ritual,trait"
		}
	],

	"UNSTACKABLE_ITEM_TYPES": ["weapon", "armor", "artifact"],

	// Item similarities determines how item piles detect similarities and differences in the system
	"ITEM_SIMILARITIES": ["name", "type", "system.reference", "system.state"],

	// Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
	// In the case of attributes, the path is relative to the "actor.system"
	// In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
	"CURRENCIES": [
		{
			type: "attribute",
			name: "Táler",
			img: "icons/commodities/currency/coins-assorted-mix-copper.webp",
			abbreviation: "{#}T",
			data: {
				path: "system.money.thaler",
			},
			primary: true,
			exchangeRate: 1
		},
		{
			type: "attribute",
			name: "Xelim",
			img: "icons/commodities/currency/coins-assorted-mix-silver.webp",
			abbreviation: "{#}S",
			data: {
				path: "system.money.shilling",
			},
			primary: false,
			exchangeRate: 0.1
		},
		{
			type: "attribute",
			name: "Ortega",
			img: "icons/commodities/currency/coins-assorted-mix-platinum.webp",
			abbreviation: "{#}O",
			data: {
				path: "system.money.orteg",
			},
			primary: false,
			exchangeRate: 0.01
		}
	],

	// Symbaroum stores item costs as free text. Normalize common coin formats to the primary currency, Thaler.
	"ITEM_COST_TRANSFORMER": (item, currencies, priceAttribute) => {
		const itemData = item?.toObject ? item.toObject() : item;
		let rawCost = foundry.utils.getProperty(itemData, priceAttribute)
			?? foundry.utils.getProperty(itemData, "system.cost")
			?? item?.system?.cost
			?? "";
		if (rawCost && typeof rawCost === "object") {
			rawCost = rawCost.value ?? rawCost.total ?? rawCost.cost ?? "";
		}
		const cost = String(rawCost).trim().toLowerCase();
		if (!cost) return 0;

		const plainNumber = Number(cost.replace(",", "."));
		if (!Number.isNaN(plainNumber)) return plainNumber;

		const rates = {
			t: 1,
			thaler: 1,
			thalers: 1,
			taler: 1,
			talers: 1,
			taleres: 1,
			táler: 1,
			táleres: 1,
			s: 0.1,
			shilling: 0.1,
			shillings: 0.1,
			xelim: 0.1,
			xelins: 0.1,
			o: 0.01,
			orteg: 0.01,
			ortegs: 0.01,
			ortega: 0.01,
			ortegas: 0.01
		};

		const denominations = Object.keys(rates).sort((a, b) => b.length - a.length).join("|");
		const matches = [...cost.matchAll(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${denominations})\\b`, "g"))];
		if (!matches.length) {
			const firstNumber = cost.match(/\d+(?:[.,]\d+)?/);
			return firstNumber ? Number(firstNumber[0].replace(",", ".")) : false;
		}

		return matches.reduce((total, [, amount, denomination]) => {
			return total + Number(amount.replace(",", ".")) * rates[denomination];
		}, 0);
	}
}
