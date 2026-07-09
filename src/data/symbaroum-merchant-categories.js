import SYMBAROUM_ITEM_GROUPS from "./symbaroum-item-groups.js";

const GROUPS = new Map(SYMBAROUM_ITEM_GROUPS.map(group => [group.id, group]));

function pool(groupId, overrides = {}) {
	const source = GROUPS.get(groupId);
	if (!source) throw new Error(`Unknown Symbaroum item group: ${groupId}`);

	const id = overrides.id ?? source.id;
	return {
		...source,
		...overrides,
		id,
		groupId: source.id,
		name: overrides.name ?? source.name,
		itemTypes: overrides.itemTypes ? [...overrides.itemTypes] : [...source.itemTypes],
		customCategories: overrides.customCategories ? [...overrides.customCategories] : [...source.customCategories],
		sourceModules: overrides.sourceModules ? [...overrides.sourceModules] : [...source.sourceModules],
		worldFolders: overrides.worldFolders ? [...overrides.worldFolders] : [...source.worldFolders],
		selectedItems: overrides.selectedItems ? [...overrides.selectedItems] : [...source.selectedItems]
	};
}

function category(id, name, description, pools, { clearExisting = true } = {}) {
	return {
		id,
		name,
		description,
		enabled: true,
		clearExisting,
		pools
	};
}

const SYMBAROUM_MERCHANT_CATEGORIES = [
	category("generic-weapons", "Comerciante de armas", "Armas comuns e incomuns para guardas, viajantes e aventureiros.", [
		pool("weapons", { maxItems: 16 }),
		pool("weapons-alchemical", { maxItems: 3, chance: 25 })
	]),
	category("generic-complete-arms", "Armeiro completo", "Armas, armaduras, escudos e algumas pecas especiais de combate.", [
		pool("weapons", { maxItems: 14 }),
		pool("armor", { maxItems: 10 }),
		pool("weapons-alchemical", { maxItems: 3, chance: 25 }),
		pool("weapons-siege", { maxItems: 2, chance: 15 })
	]),
	category("generic-armorer", "Vendedor de armaduras", "Protecoes, escudos e equipamento defensivo para personagens que procuram sobreviver.", [
		pool("armor", { maxItems: 12 })
	]),
	category("generic-expedition-supplier", "Fornecedor de expedicao", "Suprimentos de viagem, ferramentas, recipientes e armadilhas para exploracao de ruinas e florestas.", [
		pool("survival-gear", { maxItems: 18, minQuantity: 1, maxQuantity: 6 }),
		pool("specialist-tools", { maxItems: 8, chance: 75 }),
		pool("instruments-kits", { maxItems: 6, chance: 60 }),
		pool("containers", { maxItems: 8 }),
		pool("traps", { maxItems: 5, chance: 55 })
	]),
	category("generic-alchemist", "Alquimista e boticario", "Ervas, ingredientes, elixires, venenos e preparos alquimicos de risco variavel.", [
		pool("alchemy-elixirs", { maxItems: 12, minQuantity: 1, maxQuantity: 4 }),
		pool("weapons-alchemical", { maxItems: 4, chance: 35 }),
		pool("traps", { name: "Armadilhas alquimicas", search: "alchemical alquimica mine mina explosive explosivo poison veneno", maxItems: 4, chance: 35 })
	]),
	category("generic-antiquarian", "Antiquario de ruinas", "Curiosidades, detritos de valor incerto, tesouros misticos e artefatos raros.", [
		pool("curiosities", { maxItems: 12 }),
		pool("scrap-trade-goods", { maxItems: 10, minQuantity: 1, maxQuantity: 4, chance: 65 }),
		pool("artifacts-minor", { maxItems: 3, chance: 25 }),
		pool("artifacts-major", { maxItems: 1, chance: 8 })
	]),
	category("generic-tavern-inn", "Taverna e estalagem", "Comida, bebida, tabaco, pequenos confortos e itens deixados por viajantes.", [
		pool("food", { maxItems: 10, minQuantity: 1, maxQuantity: 10 }),
		pool("drink", { maxItems: 10, minQuantity: 1, maxQuantity: 10 }),
		pool("tobacco-utensils", { maxItems: 6, minQuantity: 1, maxQuantity: 6, chance: 65 }),
		pool("musical-instruments", { maxItems: 3, chance: 30 }),
		pool("clothing", { maxItems: 4, chance: 35 })
	]),
	category("generic-general-store", "Armazem geral", "Mercadorias comuns para povoados, bairros populares e comercio cotidiano.", [
		pool("survival-gear", { maxItems: 12, minQuantity: 1, maxQuantity: 6 }),
		pool("containers", { maxItems: 6 }),
		pool("food", { maxItems: 8, minQuantity: 1, maxQuantity: 10 }),
		pool("drink", { maxItems: 6, minQuantity: 1, maxQuantity: 10 }),
		pool("clothing", { maxItems: 6 }),
		pool("scrap-trade-goods", { maxItems: 8, minQuantity: 1, maxQuantity: 8, chance: 70 })
	]),
	category("generic-luxury-merchant", "Mercador de luxo", "Roupas caras, instrumentos, especiarias, tecidos e curiosidades para clientes ricos.", [
		pool("clothing", { minCost: 2, maxItems: 8 }),
		pool("spices", { minCost: 2, maxItems: 8, minQuantity: 1, maxQuantity: 6 }),
		pool("scrap-trade-goods", { minCost: 2, maxItems: 8, minQuantity: 1, maxQuantity: 6 }),
		pool("curiosities", { minCost: 5, maxItems: 6 }),
		pool("musical-instruments", { maxItems: 5, chance: 55 })
	]),
	category("generic-monster-hunter", "Mercador de trofeus e partes", "Compra e venda de trofeus, partes de criaturas e insumos perigosos para alquimia.", [
		pool("monster-trophies", { maxItems: 12, minQuantity: 1, maxQuantity: 5 }),
		pool("survival-gear", { maxItems: 6, chance: 50 })
	]),
	category("generic-transport-builder", "Transporte e construcoes", "Veiculos, transporte, carga, materiais e propriedades para campanhas de dominio.", [
		pool("transport-vehicles", { maxItems: 8, chance: 70 }),
		pool("animals", { maxItems: 6, chance: 55 }),
		pool("containers", { maxItems: 6 }),
		pool("scrap-trade-goods", { maxItems: 8, minQuantity: 1, maxQuantity: 10 })
	]),
	category("generic-black-market", "Mercado clandestino", "Itens ilegais, perigosos, raros ou vendidos sem muitas perguntas.", [
		pool("weapons", { maxItems: 8, chance: 70 }),
		pool("weapons-alchemical", { maxItems: 5, chance: 65 }),
		pool("alchemy-elixirs", { maxItems: 5, chance: 55 }),
		pool("artifacts-minor", { maxItems: 3, chance: 25 }),
		pool("curiosities", { maxItems: 6, chance: 60 })
	])
];

export default SYMBAROUM_MERCHANT_CATEGORIES;
