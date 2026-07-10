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
	group("weapons-common", "Armas Comuns", { itemTypes: ["weapon"], maxItems: 16 }),
	group("weapons-quality", "Armas de Alta Qualidade", { itemTypes: ["weapon"], maxItems: 8, chance: 55 }),
	group("weapons-siege", "Armas de Cerco", {
		itemTypes: ["weapon", "equipment"],
		search: "cerco siege ballista balestra catapult catapulta trebuchet trabuco missile battery bateria",
		maxItems: 4,
		chance: 35
	}),
	group("weapons-alchemical", "Armas Alquímicas", {
		itemTypes: ["weapon", "equipment"],
		search: "alchemical alquimica fire tube tubo fogo grenade granada rupture pot pote ruptura explosive explosivo",
		maxItems: 6,
		chance: 55
	}),
	group("armor-common", "Armaduras Comuns", { itemTypes: ["armor", "equipment"], maxItems: 12 }),
	group("armor-quality", "Armaduras de Alta Qualidade", { itemTypes: ["armor", "equipment"], maxItems: 8, chance: 55 }),
	group("elixirs-common", "Elixires Comuns", {
		itemTypes: ["equipment"],
		search: "elixir cura cure herbal antidote antidoto poison veneno goma selvagem spiritual friend amigo espiritual infusion infusao oil oleo powder po",
		maxItems: 14,
		minQuantity: 1,
		maxQuantity: 4
	}),
	group("elixirs-quality", "Elixires de Alta Qualidade", {
		itemTypes: ["equipment"],
		search: "strong forte moderate moderado life vida twilight crepuscular friend espiritual purple purpura draught infusao homunculus homunculo",
		maxItems: 8,
		minQuantity: 1,
		maxQuantity: 3,
		chance: 55
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
		search: "curio curiosidade relic reliquia antique antiguidade catalogue catalogo mirror espelho hourglass ampulheta bell sino",
		maxItems: 10
	}),
	group("scrap-trade-goods", "Sucata e Bens de Troca", {
		itemTypes: ["equipment"],
		search: "debris detrito scrap sucata broken quebrado shard fragment trade goods bens troca bar barra gold ouro silver prata copper cobre iron ferro salt sal grain grao cotton algodao silk seda roll rolo bale fardo sack saca",
		maxItems: 16,
		minQuantity: 1,
		maxQuantity: 10
	}),
	group("specialist-tools", "Ferramentas Especializadas", {
		itemTypes: ["equipment"],
		search: "tool ferramenta disguise disfarce laboratory laboratorio cartographer cartografo surgery cirurgia trickery trapaca smithy ferraria library biblioteca excavation escavacao",
		maxItems: 10
	}),
	group("traps", "Armadilhas", {
		itemTypes: ["equipment"],
		search: "trap armadilha snare arapuca bear trap urso mechanical mecanica mine mina alchemical alquimica explosive explosivo poison veneno",
		maxItems: 10,
		chance: 75
	}),
	group("traps-mechanical", "Armadilhas Mecânicas", {
		itemTypes: ["equipment"],
		search: "mechanical mecanica trap armadilha snare arapuca bear urso",
		maxItems: 8,
		chance: 70
	}),
	group("traps-alchemical", "Armadilhas e Minas Alquímicas", {
		itemTypes: ["equipment"],
		search: "alchemical alquimica mine mina explosive explosivo poison veneno",
		maxItems: 8,
		chance: 55
	}),
	group("instruments-kits", "Instrumentos", {
		itemTypes: ["equipment"],
		search: "kit instruments instrumentos apparatus aparato tools ferramentas equipment equipamento",
		maxItems: 10
	}),
	group("survival-expedition", "Equipamentos de Sobrevivência e Expedições", {
		itemTypes: ["equipment"],
		search: "rope corda tent tenda torch tocha climbing escalada spyglass luneta lantern lanterna cloth pano parchment pergaminho snowshoe neve field equipment acampar bedroll cobertor blanket",
		maxItems: 18,
		minQuantity: 1,
		maxQuantity: 6
	}),
	group("containers", "Recipientes", {
		itemTypes: ["equipment"],
		search: "container recipiente quiver aljava pouch algibeira bag bolsa backpack mochila sack saco barrel barril chest bau crate caixote box caixa basket cesta waterskin cantil vial frasco",
		maxItems: 10
	}),
	group("food", "Comida", {
		itemTypes: ["equipment"],
		search: "food comida meat carne ration racao bread pao soup sopa meal refeicao porridge mingau pie torta fish peixe stew ensopado",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 10
	}),
	group("drink", "Bebida", {
		itemTypes: ["equipment"],
		search: "drink bebida wine vinho beer cerveja ale stout blackbrew caldonegro tea cha syrup xarope bottle garrafa cider milk leite",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 10
	}),
	group("tobacco-utensils", "Tabaco e Utensílios para Fumo", {
		itemTypes: ["equipment"],
		search: "tobacco tabaco pipe cachimbo snuff rape box caixa leaf folha bitter amarga fruit frutado chew mascar",
		maxItems: 8,
		minQuantity: 1,
		maxQuantity: 6
	}),
	group("musical-instruments", "Instrumentos Musicais", {
		itemTypes: ["equipment"],
		search: "music musical bagpipe gaita horn chifre corneta organ realejo hurdy fiddle flute flauta violin violino lute alaude drum tambor harp harpa spinet espineta",
		maxItems: 8
	}),
	group("clothing", "Roupas e Vestuário", {
		itemTypes: ["equipment", "armor"],
		search: "clothes roupa clothing vestuario rags trapos field campo noble nobre dress vestido mask mascara silk seda garb traje shirt camisa cloak capa robe tunic tunica boots botas",
		maxItems: 12
	}),
	group("spices", "Especiarias", {
		itemTypes: ["equipment"],
		search: "spice especiaria saffron acafrao cinnamon canela clove cravo pepper pimenta cardamom cardamomo cumin cominho ginger gengibre mint menta sugar acucar turmeric curcuma",
		maxItems: 8,
		minQuantity: 1,
		maxQuantity: 8
	}),
	group("monster-trophies", "Troféus de Monstros", {
		itemTypes: ["equipment"],
		search: "trophy trofeu monster monstro claw garra tooth dente fang presa hide couro pelt pele organ orgao gland glandula",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 5
	}),
	group("transport-vehicles", "Transportes, Conduções e Veículos", {
		itemTypes: ["equipment"],
		search: "transport transporte sled treno cart carroca wagon vagao boat barco steam vapor ship navio vehicle veiculo carriage carruagem",
		maxItems: 8,
		chance: 50
	}),
	group("animals-derived", "Animais e Derivados", {
		itemTypes: ["equipment", "armor"],
		search: "animal mount montaria horse cavalo mule mula dog cao cachorro livestock gado skin pele fur pelo hide couro wool la eggs ovos milk leite",
		maxItems: 8,
		chance: 50
	}),
	group("buildings-domains", "Construções e Domínios", {
		itemTypes: ["equipment"],
		search: "building construcao domain dominio farm fazenda tower torre fortress fortaleza castle castelo estate propriedade",
		maxItems: 6,
		chance: 35
	}),
	group("medical", "Médico", {
		itemTypes: ["equipment"],
		search: "medical medico medicine medicamento bandage bandagem surgery cirurgia surgeon cirurgico cure cura antidote antidoto herbal erva",
		maxItems: 10,
		minQuantity: 1,
		maxQuantity: 5
	})
];

export default SYMBAROUM_ITEM_GROUPS;
