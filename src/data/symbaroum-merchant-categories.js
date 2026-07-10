import SYMBAROUM_ITEM_GROUPS from "./symbaroum-item-groups.js";

const GROUPS = new Map(SYMBAROUM_ITEM_GROUPS.map(group => [group.id, group]));

function pool(groupId, overrides = {}) {
	const source = GROUPS.get(groupId);
	if (!source) throw new Error(`Unknown Symbaroum item group: ${groupId}`);

	return {
		...source,
		...overrides,
		id: overrides.id ?? foundry.utils.randomID(),
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
	category("generic-weapons", "Comerciante de armas", "Armas comuns para guardas, viajantes e aventureiros.", [
		pool("weapons-common", { maxItems: 16 }),
		pool("weapons-quality", { maxItems: 4, chance: 30 }),
		pool("weapons-alchemical", { maxItems: 2, chance: 20 })
	]),
	category("generic-complete-arms", "Armeiro completo", "Armas, armaduras, escudos e pecas especiais de combate.", [
		pool("weapons-common", { maxItems: 14 }),
		pool("weapons-quality", { maxItems: 6, chance: 55 }),
		pool("armor-common", { maxItems: 10 }),
		pool("armor-quality", { maxItems: 5, chance: 45 }),
		pool("weapons-alchemical", { maxItems: 3, chance: 25 }),
		pool("weapons-siege", { maxItems: 2, chance: 15 })
	]),
	category("generic-armorer", "Vendedor de armaduras", "Protecoes e equipamento defensivo para personagens que procuram sobreviver.", [
		pool("armor-common", { maxItems: 12 }),
		pool("armor-quality", { maxItems: 5, chance: 45 })
	]),
	category("generic-expedition-supplier", "Fornecedor de expedicao", "Suprimentos de viagem, ferramentas, recipientes e armadilhas para exploracao de ruinas e florestas.", [
		pool("survival-expedition", { maxItems: 18, minQuantity: 1, maxQuantity: 15 }),
		pool("specialist-tools", { maxItems: 8, chance: 75 }),
		pool("instruments-kits", { maxItems: 6, chance: 60 }),
		pool("containers", { maxItems: 8 }),
		pool("traps-mechanical", { maxItems: 5, chance: 55 }),
		pool("medical", { maxItems: 5, chance: 60 })
	]),
	category("generic-alchemist", "Alquimista e boticario", "Ervas, elixires, venenos e preparos alquimicos de risco variavel.", [
		pool("elixirs-common", { maxItems: 12, minQuantity: 1, maxQuantity: 8 }),
		pool("elixirs-quality", { maxItems: 5, minQuantity: 1, maxQuantity: 2, chance: 45 }),
		pool("weapons-alchemical", { maxItems: 4, chance: 35 }),
		pool("traps-alchemical", { maxItems: 4, chance: 35 }),
		pool("medical", { maxItems: 5, chance: 60 })
	]),
	category("generic-antiquarian", "Antiquario de ruinas", "Curiosidades, detritos de valor incerto, tesouros misticos e artefatos raros.", [
		pool("curiosities", { maxItems: 12 }),
		pool("scrap-trade-goods", { maxItems: 10, minQuantity: 1, maxQuantity: 12, chance: 65 }),
		pool("artifacts-minor", { maxItems: 3, chance: 25 }),
		pool("artifacts-major", { maxItems: 1, chance: 8 })
	]),
	category("generic-tavern-inn", "Taverna e estalagem", "Comida, bebida, tabaco, pequenos confortos e itens deixados por viajantes.", [
		pool("food", { maxItems: 10, minQuantity: 1, maxQuantity: 15 }),
		pool("drink", { maxItems: 10, minQuantity: 1, maxQuantity: 15 }),
		pool("tobacco-utensils", { maxItems: 6, minQuantity: 1, maxQuantity: 10, chance: 65 }),
		pool("musical-instruments", { maxItems: 3, chance: 30 }),
		pool("clothing", { maxItems: 4, chance: 35 })
	]),
	category("generic-general-store", "Armazem geral", "Mercadorias comuns para povoados, bairros populares e comercio cotidiano.", [
		pool("survival-expedition", { maxItems: 12, minQuantity: 1, maxQuantity: 15 }),
		pool("containers", { maxItems: 6 }),
		pool("food", { maxItems: 8, minQuantity: 1, maxQuantity: 15 }),
		pool("drink", { maxItems: 6, minQuantity: 1, maxQuantity: 15 }),
		pool("clothing", { maxItems: 6 }),
		pool("scrap-trade-goods", { maxItems: 8, minQuantity: 1, maxQuantity: 15, chance: 70 })
	]),
	category("generic-luxury-merchant", "Mercador de luxo", "Roupas caras, instrumentos, especiarias, tecidos e curiosidades para clientes ricos.", [
		pool("clothing", { minCost: 2, maxItems: 8 }),
		pool("spices", { minCost: 2, maxItems: 8, minQuantity: 1, maxQuantity: 12 }),
		pool("scrap-trade-goods", { minCost: 2, maxItems: 8, minQuantity: 1, maxQuantity: 15 }),
		pool("curiosities", { minCost: 5, maxItems: 6 }),
		pool("musical-instruments", { maxItems: 5, chance: 55 }),
		pool("artifacts-minor", { maxItems: 2, chance: 20 })
	]),
	category("generic-monster-hunter", "Mercador de trofeus e partes", "Compra e venda de trofeus, partes de criaturas e insumos perigosos para alquimia.", [
		pool("monster-trophies", { maxItems: 12, minQuantity: 1, maxQuantity: 4 }),
		pool("animals-derived", { maxItems: 8, minQuantity: 1, maxQuantity: 6 }),
		pool("survival-expedition", { maxItems: 6, chance: 50 })
	]),
	category("generic-transport-builder", "Transporte e construcoes", "Veiculos, transporte, carga, materiais e propriedades para campanhas de dominio.", [
		pool("transport-vehicles", { maxItems: 8, chance: 70 }),
		pool("animals-derived", { maxItems: 6, chance: 55 }),
		pool("containers", { maxItems: 6 }),
		pool("buildings-domains", { maxItems: 4, chance: 35 }),
		pool("scrap-trade-goods", { maxItems: 8, minQuantity: 1, maxQuantity: 15 })
	]),
	category("generic-black-market", "Mercado clandestino", "Itens ilegais, perigosos, raros ou vendidos sem muitas perguntas.", [
		pool("weapons-quality", { maxItems: 8, chance: 70 }),
		pool("armor-quality", { maxItems: 5, chance: 45 }),
		pool("weapons-alchemical", { maxItems: 5, chance: 65 }),
		pool("elixirs-quality", { maxItems: 5, chance: 55 }),
		pool("artifacts-minor", { maxItems: 3, chance: 25 }),
		pool("artifacts-major", { maxItems: 1, chance: 8 }),
		pool("curiosities", { maxItems: 6, chance: 60 })
	]),
	category("official-marvaloms", "Marvalom's", "Loja lendaria de equipamentos de exploracao do Forte do Cardo, com precos mais altos que a media.", [
		pool("survival-expedition", { maxItems: 18 }),
		pool("containers", { maxItems: 8 }),
		pool("specialist-tools", { maxItems: 8 }),
		pool("medical", { maxItems: 4, chance: 45 })
	]),
	category("official-corda-machado", "A Corda e Machado", "Concorrente direta da Marvalom's, focada em equipamento limpo e de primeira linha.", [
		pool("survival-expedition", { maxItems: 18 }),
		pool("containers", { maxItems: 8 }),
		pool("specialist-tools", { maxItems: 6 }),
		pool("weapons-common", { maxItems: 4, chance: 35 })
	]),
	category("official-o-tesouro", "O Tesouro", "Casa de leiloes e antiguidades elitista para reliquias raras e artefatos superiores.", [
		pool("artifacts-major", { maxItems: 1, chance: 15 }),
		pool("artifacts-minor", { maxItems: 4, chance: 45 }),
		pool("curiosities", { maxItems: 12 }),
		pool("scrap-trade-goods", { maxItems: 6, chance: 35 })
	]),
	category("official-faraldo", "Loja de Novidades do Faraldo", "Antiguidades e curiosidades exoticas da Davokar para nobres e colecionadores.", [
		pool("curiosities", { maxItems: 14 }),
		pool("artifacts-minor", { maxItems: 4, chance: 35 }),
		pool("scrap-trade-goods", { maxItems: 8, chance: 55 })
	]),
	category("official-drogaria-taler", "A Drogaria do Taler", "Alquimia, pocoes, venenos, antidotos e componentes medicinais.", [
		pool("elixirs-common", { maxItems: 14, minQuantity: 1, maxQuantity: 8 }),
		pool("elixirs-quality", { maxItems: 6, chance: 45 }),
		pool("medical", { maxItems: 8 }),
		pool("weapons-alchemical", { maxItems: 3, chance: 35 })
	]),
	category("official-grande-golpeador", "Ferraria do Grande Golpeador", "Forja, conserto e venda de armas e armaduras de metal.", [
		pool("weapons-common", { maxItems: 14 }),
		pool("weapons-quality", { maxItems: 6, chance: 45 }),
		pool("armor-common", { maxItems: 8 }),
		pool("armor-quality", { maxItems: 4, chance: 35 })
	]),
	category("official-mae-mehira", "Agencia da Mae Mehira", "Informacao, contatos, mapas, contratos e agenciamento de servicos.", [
		pool("curiosities", { maxItems: 6, chance: 55 }),
		pool("survival-expedition", { name: "Mapas e pistas", maxItems: 5, search: "map mapa parchment pergaminho paper papel", chance: 65 })
	]),
	category("official-estande-elda", "Estande de Elda", "Rumores, mapas e achados basicos da Davokar vendidos na Praca Antiga.", [
		pool("curiosities", { maxItems: 8 }),
		pool("scrap-trade-goods", { maxItems: 8, chance: 70 }),
		pool("survival-expedition", { name: "Mapas e suprimentos leves", maxItems: 5, chance: 55 })
	]),
	category("official-praca-rainha", "Mercado da Praca da Rainha", "Barracas de segunda mao com armas usadas, couracas, drogas, ervas e elixires.", [
		pool("weapons-common", { maxItems: 8, chance: 65 }),
		pool("armor-common", { maxItems: 6, chance: 55 }),
		pool("elixirs-common", { maxItems: 6, chance: 55 }),
		pool("scrap-trade-goods", { maxItems: 12 }),
		pool("survival-expedition", { maxItems: 8, chance: 60 })
	]),
	category("official-lua-azul", "A Casa de Comercio Lua Azul", "Comercio geral, armazem e contrabando vindo da Davokar.", [
		pool("scrap-trade-goods", { maxItems: 12 }),
		pool("containers", { maxItems: 8 }),
		pool("survival-expedition", { maxItems: 8 }),
		pool("curiosities", { maxItems: 5, chance: 45 }),
		pool("artifacts-minor", { maxItems: 2, chance: 15 })
	]),
	category("official-afadir", "Taverna do Triunfo de Afadir", "Restaurante refinado famoso por vinhos do sul e bifes de veado.", [
		pool("food", { minCost: 1, maxItems: 10 }),
		pool("drink", { minCost: 1, maxItems: 10 }),
		pool("spices", { maxItems: 4, chance: 35 })
	]),
	category("official-saloes-symbaroum", "Os Saloes de Symbaroum", "Palacio do prazer com comida, bebidas, jogos, shows e entretenimento exotico.", [
		pool("food", { maxItems: 10 }),
		pool("drink", { maxItems: 12 }),
		pool("tobacco-utensils", { maxItems: 5, chance: 45 }),
		pool("musical-instruments", { maxItems: 4, chance: 35 }),
		pool("curiosities", { maxItems: 5, chance: 35 })
	]),
	category("official-caldo", "Caldo", "Taverna doce focada em bebidas acucaradas e cerveja de xarope.", [
		pool("drink", { maxItems: 12 }),
		pool("food", { maxItems: 6, chance: 55 }),
		pool("spices", { name: "Acucar e sabores", maxItems: 4, chance: 45 })
	]),
	category("official-caldonegro", "Caldonegro", "Boteco barbaro focado em bebidas fortes e caldo negro.", [
		pool("drink", { maxItems: 12 }),
		pool("food", { maxItems: 4, chance: 35 })
	]),
	category("official-lixao-odovakar", "O Lixao e Odovakar", "Tavernas rusticas para exploradores quebrados, cervejas baratas e refeicoes ralas.", [
		pool("food", { maxItems: 8 }),
		pool("drink", { maxItems: 8 }),
		pool("tobacco-utensils", { maxItems: 4, chance: 35 })
	]),
	category("official-a-ruina", "A Ruina", "Estalagem de exploradores, camas simples e sopa famosa de caldeirao antigo.", [
		pool("food", { maxItems: 8 }),
		pool("drink", { maxItems: 6 }),
		pool("survival-expedition", { maxItems: 4, chance: 35 })
	]),
	category("official-corte-harpa-concha", "A Corte e a Harpa / A Concha Alada", "Estalagens exclusivas para nobres, diplomatas e generais.", [
		pool("food", { minCost: 1, maxItems: 8 }),
		pool("drink", { minCost: 1, maxItems: 8 }),
		pool("clothing", { minCost: 1, maxItems: 4, chance: 35 })
	]),
	category("official-descanso-costureira", "O Descanso da Costureira", "Estalagem academica e tranquila para estudiosos e membros da Ordo Magica.", [
		pool("food", { maxItems: 6 }),
		pool("drink", { maxItems: 6 }),
		pool("curiosities", { name: "Livros e notas", maxItems: 4, chance: 35 })
	]),
	category("official-bruxa-familiar-arkerio", "A Bruxa e Familiar / Casa do Arkerio", "Hospedarias ordinarias, seguras e acessiveis.", [
		pool("food", { maxItems: 6 }),
		pool("drink", { maxItems: 6 }),
		pool("tobacco-utensils", { maxItems: 3, chance: 30 })
	]),
	category("official-jardim-rosa-quartel", "O Jardim da Rosa / O Quartel", "Dormitorios coletivos baratos e suprimentos de viajante pobre.", [
		pool("food", { maxItems: 5 }),
		pool("drink", { maxItems: 5 }),
		pool("clothing", { name: "Roupas gastas", maxItems: 4, chance: 35 }),
		pool("scrap-trade-goods", { maxItems: 4, chance: 45 })
	]),
	category("official-benegos", "Benego's", "Casa de jogos, apostas, dados, cartas e tabuleiros.", [
		pool("curiosities", { name: "Jogos e pecas", maxItems: 6 }),
		pool("drink", { maxItems: 5, chance: 45 })
	]),
	category("official-kodomar", "A Mercearia de Kodomar", "Comercio clandestino de refugos, ferramentas baratas e itens perigosos da Davokar.", [
		pool("scrap-trade-goods", { maxItems: 16 }),
		pool("specialist-tools", { maxItems: 8, chance: 65 }),
		pool("survival-expedition", { maxItems: 8 }),
		pool("artifacts-minor", { maxItems: 3, chance: 25 }),
		pool("weapons-alchemical", { maxItems: 3, chance: 35 })
	]),
	category("official-mercado-brejonegro", "O Mercado de Brejonegro", "Feira livre de lama e escambo fora das muralhas.", [
		pool("survival-expedition", { maxItems: 10 }),
		pool("scrap-trade-goods", { maxItems: 12 }),
		pool("food", { maxItems: 6 }),
		pool("weapons-common", { maxItems: 5, chance: 45 })
	]),
	category("official-dragao-enferrujado", "O Dragao Enferrujado", "Estalagem e taverna antiga, nobre e chique de Kastor.", [
		pool("food", { minCost: 1, maxItems: 8 }),
		pool("drink", { minCost: 1, maxItems: 8 }),
		pool("curiosities", { maxItems: 4, chance: 30 })
	]),
	category("official-sino-chefe", "O Sino do Chefe", "Estalagem de camas ruins, bebida constante e brigas de taverna.", [
		pool("drink", { maxItems: 10 }),
		pool("food", { maxItems: 5 }),
		pool("weapons-common", { name: "Armas improvisadas", maxItems: 3, chance: 30 })
	]),
	category("official-galeia", "Casa de Comercio da Galeia", "Casa de negocios, remessas, frotas e comercio importado dos portos.", [
		pool("scrap-trade-goods", { maxItems: 14 }),
		pool("spices", { maxItems: 8 }),
		pool("containers", { maxItems: 8 }),
		pool("transport-vehicles", { maxItems: 4, chance: 35 })
	]),
	category("official-trajes-marlit", "Alfaiataria Trajes de Marlit de Fredo", "Roupas de couro e materiais texteis resistentes feitos de pele exotica.", [
		pool("clothing", { maxItems: 10 }),
		pool("armor-common", { maxItems: 5, chance: 45 }),
		pool("animals-derived", { maxItems: 5, chance: 45 })
	]),
	category("official-cofre-vitoria-ynedar", "Cofre da Vitoria / Legado de Ynedar", "Tavernas de alta classe com bebidas, refeicoes finas e bardos.", [
		pool("food", { minCost: 1, maxItems: 8 }),
		pool("drink", { minCost: 1, maxItems: 8 }),
		pool("musical-instruments", { maxItems: 3, chance: 25 })
	]),
	category("official-sotao-banquete", "Sotao da Prefeitura / Banquete da Davokar", "Restaurantes sofisticados com gastronomia ambriana e vinhos caros.", [
		pool("food", { minCost: 1, maxItems: 10 }),
		pool("drink", { minCost: 1, maxItems: 8 }),
		pool("spices", { maxItems: 5, chance: 45 })
	]),
	category("official-o-sitio", "O Sitio", "Taverna pobre de Yndaros com comida duvidosa e bebida diluida.", [
		pool("food", { maxItems: 6 }),
		pool("drink", { maxItems: 6 })
	]),
	category("official-luva-aco", "Luva de Aco", "Bar boemio com alcool rustico e apostas de luta.", [
		pool("drink", { maxItems: 10 }),
		pool("food", { maxItems: 5, chance: 45 }),
		pool("weapons-common", { maxItems: 3, chance: 25 })
	]),
	category("official-vivisectorio", "Vivisectorio", "Entretenimento academico da Ordo Magica com disseccao de monstros exoticos.", [
		pool("monster-trophies", { maxItems: 8 }),
		pool("medical", { maxItems: 5, chance: 45 }),
		pool("curiosities", { maxItems: 4, chance: 35 })
	]),
	category("official-banho-vapor", "Banho de Vapor", "Casa de banhos, massagens e lavagem corporal perto das docas.", [
		pool("clothing", { name: "Toalhas e vestuario", maxItems: 4, chance: 45 }),
		pool("spices", { name: "Oleos e aromas", maxItems: 5, chance: 55 }),
		pool("drink", { maxItems: 4, chance: 35 })
	]),
	category("official-tuvinels-bego", "Tuvinel's / Porao do Bego", "Vinhos, cidras e castas exoticas de alcool refinado.", [
		pool("drink", { minCost: 1, maxItems: 12 }),
		pool("spices", { maxItems: 3, chance: 30 })
	]),
	category("official-o-selvagem", "O Selvagem", "Boteco de caldonegro para guerreiros e mercenarios.", [
		pool("drink", { maxItems: 10 }),
		pool("food", { maxItems: 4, chance: 35 })
	]),
	category("official-galeria-legado", "Galeria do Legado", "Artes, antiguidades, pinturas, esculturas e apresentacoes culturais.", [
		pool("curiosities", { maxItems: 12 }),
		pool("artifacts-minor", { maxItems: 3, chance: 25 }),
		pool("scrap-trade-goods", { name: "Materiais artisticos", maxItems: 5, chance: 35 })
	]),
	category("official-caranguejo-pernas-coruja", "O Caranguejo e Camarao / Pernas Cansadas / A Coruja e a Noite", "Estalagens e bares para viajantes e vida noturna de Yndaros.", [
		pool("food", { maxItems: 8 }),
		pool("drink", { maxItems: 8 }),
		pool("tobacco-utensils", { maxItems: 4, chance: 40 })
	]),
	category("official-norlio", "Mestre Alfaiate Norlio", "Roupas finas, trajes de burgues e nobres, mascaras e gala.", [
		pool("clothing", { minCost: 1, maxItems: 12 }),
		pool("curiosities", { name: "Adornos e mascaras", maxItems: 4, chance: 35 })
	]),
	category("official-amigo-prospector", "Amigo do Prospector", "Monopolio de suprimentos no acampamento do Tumulo de Salindra, com precos abusivos.", [
		pool("survival-expedition", { maxItems: 12 }),
		pool("specialist-tools", { maxItems: 6 }),
		pool("food", { maxItems: 6 }),
		pool("containers", { maxItems: 5 })
	]),
	category("official-covil-jogo", "O Covil do Jogo 5:2", "Venda de licencas e direitos de escavacao nas colinas.", [
		pool("curiosities", { name: "Licencas e papeis", search: "paper papel parchment pergaminho", maxItems: 4 })
	]),
	category("official-mandibula-cruel", "Armadilhas de Mandibula Cruel", "Engenhos de caca para monstros, de lacos simples a maquinas mortais.", [
		pool("traps", { maxItems: 10 }),
		pool("traps-mechanical", { maxItems: 8 }),
		pool("specialist-tools", { maxItems: 5, chance: 45 })
	]),
	category("official-armazem-orola", "Armazem da Orola", "Suprimentos barbaros de Karvosti, escambo de peles, carnes, ferramentas e flechas.", [
		pool("animals-derived", { maxItems: 8 }),
		pool("food", { maxItems: 8 }),
		pool("specialist-tools", { maxItems: 5 }),
		pool("weapons-common", { maxItems: 5 }),
		pool("survival-expedition", { maxItems: 6 })
	]),
	category("official-companhia-azul", "A Companhia Azul", "Companhia mercenaria itinerante que negocia espolios de guerra e comercio sujo.", [
		pool("weapons-common", { maxItems: 8 }),
		pool("weapons-quality", { maxItems: 5, chance: 55 }),
		pool("armor-common", { maxItems: 5, chance: 45 }),
		pool("scrap-trade-goods", { maxItems: 8 }),
		pool("curiosities", { maxItems: 4, chance: 35 })
	])
];

export default SYMBAROUM_MERCHANT_CATEGORIES;
