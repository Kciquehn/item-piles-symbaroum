import { ClassicLevel } from "classic-level";
import fs from "node:fs/promises";
import path from "node:path";

const packPath = path.resolve("packs/symbaroum-services");
const moduleId = "item-piles-symbaroum";

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

const services = [
	{
		_id: "thistleToll00001",
		name: "Pedágio: Forte do Cardo (por perna ou roda)",
		type: "equipment",
		img: "icons/commodities/currency/coin-inset-copper.webp",
		effects: [],
		folder: null,
		sort: 100000,
		flags: {
			[moduleId]: {
				item: {
					isService: true,
					infiniteQuantity: "yes",
					displayQuantity: "no",
					keepZeroQuantity: true,
					keepOnMerchant: true,
					cantBeSoldToMerchants: true,
					customCategory: ["services-administrative"]
				}
			}
		},
		system: {
			bonus: structuredClone(baseBonus),
			isArtifact: false,
			power: {},
			description: `<p><strong>Pedágio oficial para entrar em Forte do Cardo.</strong></p>
<p>O preço base é de <strong>1 xelim por perna ou roda</strong> que passe pelo portão. Compre a quantidade correspondente ao total de pernas, patas e rodas do grupo.</p>
<ul>
<li>Uma pessoa a pé: 2 xelins.</li>
<li>Uma pessoa puxando uma carroça de duas rodas: 4 xelins.</li>
<li>Um cavaleiro montado: 6 xelins.</li>
<li>Um veterano perneta a pé: 1 xelim.</li>
</ul>
<p>Quem entra a negócios também deve declarar seus bens e pagar <strong>10% do valor de mercado</strong> em taxas para os cofres do prefeito.</p>`,
			reference: "Forte do Cardo",
			cost: "1 xelim",
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
	}
];

await fs.rm(packPath, { recursive: true, force: true });
await fs.mkdir(packPath, { recursive: true });

const db = new ClassicLevel(packPath, { valueEncoding: "json" });
await db.open();
for (const service of services) {
	await db.put(`!items!${service._id}`, service);
}
await db.close();
