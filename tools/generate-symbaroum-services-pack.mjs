import { ClassicLevel } from "classic-level";
import fs from "node:fs/promises";
import path from "node:path";

const packPath = path.resolve("packs/symbaroum-services");
const moduleId = "item-piles-symbaroum";
const serviceImage = `modules/${moduleId}/assets/services.png`;

const baseBonus = {
	defense: 0,
	accurate: 0,
	cunning: 0,
	discreet: 0,
	persuasive: 0,
	quick: 0,
	resolute: 0,
	strong: 0,
	vigilant: 0,
	toughness: {
		max: 0,
		threshold: 0
	},
	corruption: {
		max: 0,
		threshold: 0
	},
	experience: {
		value: 0,
		cost: 0
	}
};

const serviceEntries = [
	{
		id: "thistleToll00001",
		name: "Pedágio: Forte do Cardo (por perna ou roda)",
		rawCost: "1 xelim por perna ou roda",
		cost: "1 xelim",
		description: "Pedágio oficial para entrar em Forte do Cardo. Compre a quantidade correspondente ao total de pernas, patas e rodas do grupo.",
		details: [
			"Uma pessoa a pé: 2 xelins.",
			"Uma pessoa puxando uma carroça de duas rodas: 4 xelins.",
			"Um cavaleiro montado: 6 xelins.",
			"Um veterano perneta a pé: 1 xelim.",
			"Quem entra a negócios também deve declarar seus bens e pagar 10% do valor de mercado em taxas para os cofres do prefeito."
		],
		source: "Forte do Cardo",
		reference: "Pedágio",
		category: "Serviços - Pedágios e Taxas"
	},
	{ id: "symSvc0000000001", name: "Aluguel bom", rawCost: "2 táleres/semana; 10 táleres/mês", description: "Três aposentos na Praça Antiga.", source: "Livro Básico", reference: "Aluguel em Forte do Cardo", category: "Serviços - Aluguel e Imóveis" },
	{ id: "symSvc0000000002", name: "Aluguel ordinário", rawCost: "1 táler/semana; 4 táleres/mês", description: "Três aposentos no Portão Oeste.", source: "Livro Básico", reference: "Aluguel em Forte do Cardo", category: "Serviços - Aluguel e Imóveis" },
	{ id: "symSvc0000000003", name: "Aluguel simples", rawCost: "5 xelins/semana; 2 táleres/mês", description: "Um aposento a leste da Praça do Sapo.", source: "Livro Básico", reference: "Aluguel em Forte do Cardo", category: "Serviços - Aluguel e Imóveis" },
	{ id: "symSvc0000000004", name: "Tropa desafiadora", rawCost: "1 táler/dia", description: "5 pontos de combate. Exemplos: guerreiro da guarda, oficial e sapador.", source: "Guia do Mestre", reference: "Tabela 20: Contratando Tropas", category: "Serviços - Contratação" },
	{ id: "symSvc0000000005", name: "Tropa forte", rawCost: "5 táleres/dia", description: "10 pontos de combate. Exemplos: cavaleiro, mestre da ordem e teurgo.", source: "Guia do Mestre", reference: "Tabela 20: Contratando Tropas", category: "Serviços - Contratação" },
	{ id: "symSvc0000000006", name: "Tropa fraca", rawCost: "1 ortega/dia", description: "1 ponto de combate. Exemplos: lavrador, caçador de fortunas e escudeiro.", source: "Guia do Mestre", reference: "Tabela 20: Contratando Tropas", category: "Serviços - Contratação" },
	{ id: "symSvc0000000007", name: "Tropa ordinária", rawCost: "1 xelim/dia", description: "2 pontos de combate. Exemplos: arqueiro, soldado de infantaria e guerreiro da aldeia.", source: "Guia do Mestre", reference: "Tabela 20: Contratando Tropas", category: "Serviços - Contratação" },
	{ id: "symSvc0000000008", name: "Banquete em taverna, cidade", rawCost: "1 táler por pessoa", description: "Banquete servido em uma taverna da cidade.", source: "Livro Básico", reference: "Despesas", category: "Serviços - Comida e Bebida" },
	{ id: "symSvc0000000009", name: "Banquete em taverna, interior", rawCost: "1 xelim por pessoa", description: "Banquete servido em uma taverna do interior.", source: "Livro Básico", reference: "Despesas", category: "Serviços - Comida e Bebida" },
	{ id: "symSvc0000000010", name: "Pombal no interior", rawCost: "1 ortega/dia", description: "Acomodação muito simples no interior.", source: "Livro Básico", reference: "Hospedagem", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000011", name: "Taverna, cidade", rawCost: "1+ xelins/dia", cost: "1 xelim", description: "Cama e duas refeições por dia em uma taverna da cidade. O preço indicado é mínimo; ajuste a quantidade ou negocie o valor para opções melhores.", source: "Livro Básico", reference: "Hospedagem", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000012", name: "Taverna, interior", rawCost: "5 ortegas/dia", description: "Cama e duas refeições por dia em uma taverna do interior.", source: "Livro Básico", reference: "Hospedagem", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000013", name: "Hospedagem boa", rawCost: "2 xelins/noite; 1 táler/semana; 4 táleres/mês", description: "Exemplos: O Descanso da Costureira e A Ruína.", source: "Livro Básico", reference: "Hospedagem em Forte do Cardo", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000014", name: "Hospedagem exclusiva", rawCost: "1 táler/noite", description: "Exemplos: A Corte e Harpa e A Concha Alada.", source: "Livro Básico", reference: "Hospedagem em Forte do Cardo", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000015", name: "Hospedagem ordinária", rawCost: "1 xelim/noite; 5 xelins/semana; 2 táleres/mês", description: "Exemplos: A Bruxa e Familiar e Arkerio.", source: "Livro Básico", reference: "Hospedagem em Forte do Cardo", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000016", name: "Hospedagem simples", rawCost: "5 ortegas/noite; 2 xelins/semana; 1 táler/mês", description: "Exemplos: O Jardim da Rosa e A Guarnição.", source: "Livro Básico", reference: "Hospedagem em Forte do Cardo", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000017", name: "Compra boa", rawCost: "500 táleres", description: "Compra de três aposentos na Praça Antiga.", source: "Livro Básico", reference: "Imóveis em Forte do Cardo", category: "Serviços - Aluguel e Imóveis" },
	{ id: "symSvc0000000018", name: "Compra ordinária", rawCost: "300 táleres", description: "Compra de três aposentos no Portão Oeste.", source: "Livro Básico", reference: "Imóveis em Forte do Cardo", category: "Serviços - Aluguel e Imóveis" },
	{ id: "symSvc0000000019", name: "Adicional: carroças", rawCost: "5 táleres/carroça", description: "Adicional por carroça incluída na expedição.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000020", name: "Adicional: colher", rawCost: "5-12 táleres", description: "Adicional da licença para colher recursos.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000021", name: "Adicional: explorar", rawCost: "5 táleres/pessoa", description: "Adicional da licença para exploração.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000022", name: "Adicional: incompetência", rawCost: "5-15 táleres", description: "Sobretaxa aplicada conforme a experiência do grupo.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000023", name: "Adicional: intenções", rawCost: "5-50 táleres", description: "Sobretaxa aplicada conforme o objetivo declarado da expedição.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000024", name: "Adicional: outros", rawCost: "1-50 táleres", description: "Outras sobretaxas determinadas pela autoridade licenciadora.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000025", name: "Adicional: pegar", rawCost: "3-10 táleres", description: "Adicional da licença para coletar materiais.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000026", name: "Licença ilimitada", rawCost: "450 táleres/ano", description: "Licença de explorador sem limite de pessoas.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000027", name: "Licença individual", rawCost: "2 táleres/mês; 9 táleres/ano", description: "Licença de explorador para uma pessoa.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000028", name: "Licença para 2-5 pessoas", rawCost: "10 táleres/mês; 50 táleres/ano", description: "Licença de explorador para um grupo de duas a cinco pessoas.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000029", name: "Licença para 6-8 pessoas", rawCost: "25 táleres/mês; 90 táleres/ano", description: "Licença de explorador para um grupo de seis a oito pessoas.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000030", name: "Licença para 9-10 pessoas", rawCost: "55 táleres/mês; 180 táleres/ano", description: "Licença de explorador para um grupo de nove a dez pessoas.", source: "Livro Básico", reference: "Licença de Explorador", category: "Serviços - Licenças e Taxas" },
	{ id: "symSvc0000000031", name: "Banho em estalagem", rawCost: "3 ortegas", description: "Banho disponibilizado por uma estalagem.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Hospedagem" },
	{ id: "symSvc0000000032", name: "Cartógrafo", rawCost: "1 táler", description: "Serviço profissional de cartografia.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Profissionais" },
	{ id: "symSvc0000000033", name: "Guarda-costas", rawCost: "1 xelim/dia", description: "Contratação diária de um guarda-costas.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Contratação" },
	{ id: "symSvc0000000034", name: "Lavanderia", rawCost: "7 ortegas", description: "Lavagem de roupas e tecidos.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Profissionais" },
	{ id: "symSvc0000000035", name: "Médico", rawCost: "1 xelim + preparações", cost: "1 xelim", description: "Atendimento médico; preparações alquímicas utilizadas são cobradas separadamente.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Médico" },
	{ id: "symSvc0000000036", name: "Místico, ritual", rawCost: "10 táleres", description: "Contratação de um místico para executar um ritual.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Profissionais" },
	{ id: "symSvc0000000037", name: "Pedágio de estrada/cidade", rawCost: "1 ortega", description: "Taxa para atravessar uma estrada controlada ou entrar por um portão urbano.", source: "Livro Básico", reference: "Serviços", category: "Serviços - Pedágios e Taxas" }
];

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function normalizeServiceCost(rawCost) {
	return String(rawCost ?? "")
		.split(";")[0]
		.replace(/\s+por\s+pessoa/iu, "")
		.replace(/\s*\+\s*prepara(?:ç|c)ões/iu, "")
		.replace(/\s*\/\s*[^;]+$/u, "")
		.replace(/\b1\+\s*xelins\b/iu, "1 xelim")
		.replace(/[–—]/gu, "-")
		.trim();
}

function buildDescription(entry, cost) {
	const paragraphs = [
		`<p><strong>${escapeHtml(entry.name)}</strong></p>`,
		entry.description ? `<p>${escapeHtml(entry.description)}</p>` : "",
		`<p><strong>Custo principal:</strong> ${escapeHtml(cost)}.</p>`
	];

	if (entry.rawCost && entry.rawCost !== cost) {
		paragraphs.push(`<p><strong>Preço original/opções:</strong> ${escapeHtml(entry.rawCost)}.</p>`);
	}
	if (entry.details?.length) {
		paragraphs.push(`<ul>${entry.details.map(detail => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>`);
	}
	if (entry.source || entry.reference) {
		paragraphs.push(`<p><strong>Fonte:</strong> ${escapeHtml([entry.source, entry.reference].filter(Boolean).join(" - "))}</p>`);
	}

	return paragraphs.filter(Boolean).join("\n");
}

function createService(entry, index) {
	const cost = entry.cost ?? normalizeServiceCost(entry.rawCost);
	return {
		_id: entry.id,
		name: entry.name,
		type: "equipment",
		img: serviceImage,
		effects: [],
		folder: null,
		sort: 100000 + (index * 1000),
		flags: {
			[moduleId]: {
				item: {
					isService: true,
					infiniteQuantity: "yes",
					displayQuantity: "no",
					keepZeroQuantity: true,
					keepOnMerchant: true,
					cantBeSoldToMerchants: true,
					customCategory: [entry.category ?? "Serviços"]
				}
			}
		},
		system: {
			bonus: structuredClone(baseBonus),
			isArtifact: false,
			power: {},
			description: buildDescription(entry, cost),
			reference: [entry.source, entry.reference].filter(Boolean).join(" - "),
			cost,
			number: 1,
			state: "other"
		},
		ownership: {
			default: 0
		},
		_stats: {
			compendiumSource: null,
			duplicateSource: null,
			exportSource: null,
			coreVersion: "13.351",
			systemId: "symbaroum",
			systemVersion: "6.0.0",
			createdTime: 1783700000000,
			modifiedTime: 1783700000000,
			lastModifiedBy: null
		}
	};
}

const services = serviceEntries.map(createService);

await fs.rm(packPath, { recursive: true, force: true });
await fs.mkdir(packPath, { recursive: true });

const db = new ClassicLevel(packPath, { valueEncoding: "json" });
await db.open();
for (const service of services) {
	await db.put(`!items!${service._id}`, service);
}
await db.close();
