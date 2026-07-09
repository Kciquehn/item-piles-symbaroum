function group(id, name, {
	itemTypes = ["equipment"],
	search = "",
	includeNoCost = true,
	maxItems = 10,
	minQuantity = 1,
	maxQuantity = 1,
	chance = 100
} = {}) {
	return {
		id,
		name,
		enabled: true,
		itemTypes,
		customCategories: [],
		sourceModules: [],
		worldFolders: [],
		search,
		minCost: "",
		maxCost: "",
		includeNoCost,
		maxItems,
		minQuantity,
		maxQuantity,
		chance,
		selectedItems: []
	};
}

const SYMBAROUM_ITEM_GROUPS = [
	group("weapons", "Armas", { itemTypes: ["weapon"], maxItems: 16 }),
	group("weapons-siege", "Armas de Cerco", {
		itemTypes: ["weapon", "equipment"],
		search: "cerco siege ballista balestra catapult catapulta trebuchet trabuco missile battery bateria",
		maxItems: 4,
		chance: 35
	}),
	group("weapons-alchemical", "Armas Alquímicas", {
		itemTypes: ["weapon", "equipment"],
		search: "alchemical alquimic alquimica fire tube tubo fogo grenade granada rupture pot pote ruptura explosive explosivo",
		maxItems: 6,
		chance: 55
	}),
	group("armor", "Armaduras", {
		itemTypes: ["armor"],
		maxItems: 12
	}),
	group("alchemy-elixirs", "Elixires Alquímicos", {
		itemTypes: ["equipment"],
		search: "elixir cura cure herbal antidote antidoto poison veneno goma selvagem spiritual friend amigo espiritual infusion infusao mutagenic mutagenica oil oleo powder po",
		maxItems: 14,
		minQuantity: 1,
		maxQuantity: 4
	}),
	group("artifacts-major", "Artefatos Maiores", {
		itemTypes: ["equipment", "armor", "weapon", "artifact"],
		search: "major maior superior artifact artefato legendary lendario corruption corrupcao experience experiencia",
		maxItems: 2,
		chance: 15
	}),
	group("artifacts-minor", "Artefatos Menores", {
		itemTypes: ["equipment", "armor", "weapon", "artifact"],
		search: "minor lesser menor artifact artefato ring anel mask mascara seal selo codex codice ritual scroll pergaminho",
		maxItems: 4,
		chance: 35
	}),
	group("curiosities", "Curiosidades", {
		itemTypes: ["equipment"],
		search: "curio curiosidade relic reliquia flute flauta bone osso chess xadrez necklace colar pearl perola black preta",
		maxItems: 10
	}),
	group("scrap-trade-goods", "Sucata e Bens de Troca", {
		itemTypes: ["equipment"],
		search: "debris detrito scrap sucata broken quebrado shard fragment trade goods bens troca bar barra gold ouro silver prata copper cobre salt sal grain grao cotton algodao silk seda roll rolo bale fardo sack saca",
		maxItems: 16,
		minQuantity: 1,
		maxQuantity: 10
	}),
	group("specialist-tools", "Ferramentas Especializadas", {
		itemTypes: ["equipment"],
		search: "tool ferramenta disguise disfarce laboratory laboratorio cartographer cartografo surgery cirurgia trickery trapaca",
		maxItems: 10
	}),
	group("traps", "Armadilhas", {
		itemTypes: ["equipment"],
		search: "trap armadilha snare arapuca bear trap urso mechanical mecanica mine mina alchemical alquimica explosive explosivo poison veneno",
		maxItems: 10,
		chance: 75
	}),
	group("instruments-kits", "Instrumentos", {
		itemTypes: ["equipment"],
		search: "kit instruments instrumentos apparatus aparatos tools ferramentas equipment equipamento",
		maxItems: 10
	}),
	group("survival-gear", "Equipamentos de Sobrevivência", {
		itemTypes: ["equipment"],
		search: "rope corda tent tenda torch tocha climbing escalada spyglass luneta lantern lanterna cloth pano parchment pergaminho snowshoe neve",
		maxItems: 18,
		minQuantity: 1,
		maxQuantity: 6
	}),
	group("containers", "Recipientes", {
		itemTypes: ["equipment"],
		search: "container recipiente quiver aljava pouch algibeira bag bolsa backpack mochila sack saco barrel barril chest bau crate caixote box caixa",
		maxItems: 10
	}),
	group("food", "Comida", {
		itemTypes: ["equipment"],
		search: "food comida meat carne ration racao bread pao soup sopa meal refeicao",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 10
	}),
	group("drink", "Bebida", {
		itemTypes: ["equipment"],
		search: "drink bebida wine vinho beer cerveja ale stout blackbrew caldonegro tea cha syrup xarope",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 10
	}),
	group("tobacco-utensils", "Tabaco e Utensílios", {
		itemTypes: ["equipment"],
		search: "tobacco tabaco pipe cachimbo snuff rape box caixa leaf folha bitter amarga fruit frutado chew mascar",
		maxItems: 8,
		minQuantity: 1,
		maxQuantity: 6
	}),
	group("musical-instruments", "Instrumentos Musicais", {
		itemTypes: ["equipment"],
		search: "music musical organ realejo flute flauta violin violino lute alaude drum tambor harp harpa",
		maxItems: 8
	}),
	group("clothing", "Roupas e Vestuário", {
		itemTypes: ["equipment", "armor"],
		search: "clothes roupa clothing vestuario rags trapos field campo noble nobre dress vestido mask mascara silk seda",
		maxItems: 12
	}),
	group("spices", "Especiarias", {
		itemTypes: ["equipment"],
		search: "spice especiaria saffron acafrao cinnamon canela clove cravo pepper pimenta",
		maxItems: 8,
		minQuantity: 1,
		maxQuantity: 8
	}),
	group("monster-trophies", "Troféus de Monstros", {
		itemTypes: ["equipment"],
		search: "trophy trofeu monster monstro claw garra tooth dente fang presa hide couro pelt pele organ organo gland glandula",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 5
	}),
	group("transport-vehicles", "Transporte, Conduções e Veículos", {
		itemTypes: ["equipment"],
		search: "transport transporte sled treno cart carroca wagon vagao boat barco steam vapor ship navio vehicle veiculo carriage carruagem",
		maxItems: 8,
		chance: 50
	}),
	group("animals", "Animais", {
		itemTypes: ["equipment"],
		search: "animal mount montaria horse cavalo mule mula dog cao cachorro livestock gado",
		maxItems: 8,
		chance: 50
	})
];

export default SYMBAROUM_ITEM_GROUPS;
