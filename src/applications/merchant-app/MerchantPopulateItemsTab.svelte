<script>
	import { localize } from "#runtime/util/i18n";
	import { get, writable } from "svelte/store";
	import { onDestroy } from "svelte";
	import { TJSDialog } from "#runtime/svelte/application";
	import CustomDialog from "../components/CustomDialog.svelte";
	import ItemEntry from "./components/ItemEntry.svelte";
	import * as PileUtilities from "../../helpers/pile-utilities.js";
	import { custom_warning, getSetting } from "../../helpers/helpers";
	import { slide } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import SETTINGS from "../../constants/settings";
	import CONSTANTS from "../../constants/constants.js";
	import CustomCategoryInput from "../components/CustomCategoryInput.svelte";
	import merchantCatalog from "../../data/symbaroum-sellable-items.json";
	import {
		getSymbaroumItemCategories,
		itemHasSymbaroumCategory
	} from "../../helpers/symbaroum-item-categories.js";

	export let store;

	let tables = writable(getTables());

	let populationTables = writable((get(store.pileData).tablesForPopulate ?? [])
		.map(t => {
			if (t.id) {
				t.uuid = game.tables.get(t.id).uuid;
			}
			return {
				uuid: t.uuid,
				addAll: t.addAll ?? false,
				open: false,
				timesToRoll: t.timesToRoll ?? "1d4",
				items: t.items ?? {},
				customCategory: t.customCategory ?? "",
			};
		}));

	let timesRolled = "";
	let keepRolled = false;
	let selectedMerchantCategoryId = "";
	let rolledItemsRemoveExisting = false;

	let itemStore = store.items;
	let merchantItemCategories = writable(getMerchantItemCategories());

	$: currentItems = $itemStore.sort((a, b) => {
		return a.item.name < b.item.name ? -1 : 1;
	}).filter(item => !item.isService);

	$: currentServices = $itemStore.sort((a, b) => {
		return a.item.name < b.item.name ? -1 : 1;
	}).filter(item => item.isService);

	$: {
		debounceSave($populationTables, $tables)
	}

	const debounceSave = foundry.utils.debounce((popTables, actualTables) => {
		const pileData = foundry.utils.deepClone(get(store.pileData));
		pileData.tablesForPopulate = popTables
			.filter((t) => actualTables[t.uuid])
			.map((t) => ({
				uuid: t.uuid, addAll: t.addAll, items: t.items, timesToRoll: t.timesToRoll, customCategory: t.customCategory
			}));
		PileUtilities.updateItemPileData(store.actor, pileData);
	}, 200);

	let selectableTables = [];
	let selectedTable = "";
	$: {
		selectableTables = Object.entries($tables).filter(entry => !$populationTables.some(table => table.uuid === entry[0]));
		const tableSet = new Set(selectableTables.map(e => e[0]));
		selectedTable = tableSet.has(selectedTable) ? selectedTable : tableSet.first();
	}

	let itemsRolled = writable([]);

	$: enabledMerchantItemCategories = $merchantItemCategories.filter(category => category.enabled !== false);
	$: {
		const categoryIds = new Set(enabledMerchantItemCategories.map(category => category.id));
		selectedMerchantCategoryId = categoryIds.has(selectedMerchantCategoryId)
			? selectedMerchantCategoryId
			: enabledMerchantItemCategories[0]?.id ?? "";
	}
	$: selectedMerchantCategory = enabledMerchantItemCategories.find(category => category.id === selectedMerchantCategoryId);

	function getMerchantItemCategories() {
		const categories = getSetting(SETTINGS.MERCHANT_ITEM_CATEGORIES, []);
		return Array.isArray(categories) ? categories : [];
	}

	function getCatalogKey(item) {
		return [
			item.name ?? "",
			item.type ?? "",
			item.cost ?? "",
			item.reference ?? "",
			item.state ?? "",
			item.img ?? ""
		].join("|");
	}

	function getItemKey(item) {
		return item.uuid ?? getCatalogKey(item);
	}

	function getCatalogCost(item) {
		if (typeof item.cost === "number") return item.cost;
		const match = String(item.cost ?? "").replace(",", ".").match(/[\d.]+/);
		return match ? Number(match[0]) : null;
	}

	function getWorldItemCost(item) {
		return foundry.utils.getProperty(item, game.itempiles.API.ITEM_PRICE_ATTRIBUTE) ?? "";
	}

	function getWorldItemCustomCategories(item) {
		return getSymbaroumItemCategories(item);
	}

	function getFolderAndChildIds(folderId) {
		const folder = game.folders.get(folderId);
		if (!folder) return [];
		return [
			folder.id,
			...folder.children.flatMap(child => getFolderAndChildIds(child.folder.id))
		];
	}

	function getAllowedWorldFolderIds(pool) {
		const folders = Array.isArray(pool.worldFolders) ? pool.worldFolders : [];
		if (!folders.length) return null;
		return new Set(folders.flatMap(getFolderAndChildIds));
	}

	function getWorldItems() {
		return Array.from(game.items ?? []).map(item => ({
			name: item.name,
			type: item.type,
			cost: getWorldItemCost(item),
			reference: foundry.utils.getProperty(item, "system.reference") ?? "",
			state: foundry.utils.getProperty(item, "system.state") ?? "",
			customCategories: getWorldItemCustomCategories(item),
			img: item.img,
			uuid: item.uuid,
			folderId: item.folder?.id ?? "",
			item
		}));
	}

	const DEFAULT_STOCK_QUANTITY_RANGES = {
		"weapons-common": [1, 3],
		"weapons-quality": [1, 2],
		"weapons-siege": [1, 1],
		"weapons-alchemical": [1, 2],
		"armor-common": [1, 3],
		"armor-quality": [1, 2],
		"elixirs-common": [1, 8],
		"elixirs-quality": [1, 3],
		"artifacts-major": [1, 1],
		"artifacts-minor": [1, 2],
		"curiosities": [1, 3],
		"scrap-trade-goods": [1, 15],
		"specialist-tools": [1, 6],
		"traps": [1, 4],
		"traps-mechanical": [1, 4],
		"traps-alchemical": [1, 3],
		"instruments-kits": [1, 8],
		"survival-expedition": [1, 15],
		"containers": [1, 10],
		"food": [1, 15],
		"drink": [1, 15],
		"tobacco-utensils": [1, 10],
		"musical-instruments": [1, 2],
		"clothing": [1, 8],
		"spices": [1, 12],
		"monster-trophies": [1, 4],
		"transport-vehicles": [1, 1],
		"animals-derived": [1, 6],
		"buildings-domains": [1, 1],
		"medical": [1, 12]
	};

	function getDefaultStockQuantityRange(pool) {
		return DEFAULT_STOCK_QUANTITY_RANGES[pool.groupId] ?? DEFAULT_STOCK_QUANTITY_RANGES[pool.id] ?? [1, 6];
	}

	function randomQuantity(pool) {
		const [defaultMin, defaultMax] = getDefaultStockQuantityRange(pool);
		const min = Math.max(Number(pool.minQuantity) || defaultMin, 1);
		const max = Math.max(Number(pool.maxQuantity) || defaultMax, min);
		if (max === min) return min;
		return Math.round((rollInteger(min, max) + rollInteger(min, max)) / 2);
	}

	function rollInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function randomizeSymbaroumPriceRange(price) {
		const source = String(price ?? "").trim();
		const match = source.match(/(\d+)\s*(?:-|–|—|−)\s*(\d+)\s*(t[aá]ler(?:es)?|thaler(?:s)?|xelim(?:s)?|shilling(?:s)?|ortega(?:s)?|orteg(?:s)?)/i);
		if (!match) return null;
		const min = Number(match[1]);
		const max = Number(match[2]);
		if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
		const amount = rollInteger(Math.min(min, max), Math.max(min, max));
		return `${amount} ${match[3].toLowerCase()}`;
	}

	function rollStockPriceModifier() {
		const roll = Math.random();
		if (roll < 0.2) return 0.85 + Math.random() * 0.1;
		if (roll > 0.9) return 1.05 + Math.random() * 0.1;
		return 1;
	}

	function randomizeSymbaroumFixedPrice(price) {
		const source = String(price ?? "").trim();
		const match = source.match(/^(\d+(?:[.,]\d+)?)\s*(t[aÃ¡á]ler(?:es)?|thaler(?:s)?|xelim(?:s)?|shilling(?:s)?|ortega(?:s)?|orteg(?:s)?)$/i);
		if (!match) return null;
		const amount = Number(match[1].replace(",", "."));
		if (!Number.isFinite(amount) || amount <= 0) return null;
		const modifier = rollStockPriceModifier();
		if (modifier === 1) return null;
		const adjusted = Math.max(1, Math.round(amount * modifier));
		if (adjusted === amount) return null;
		return `${adjusted} ${match[2].toLowerCase()}`;
	}

	function randomizeSymbaroumStockPrice(price) {
		return randomizeSymbaroumPriceRange(price) ?? randomizeSymbaroumFixedPrice(price);
	}

	function shuffleItems(items) {
		const shuffled = [...items];
		for (let index = shuffled.length - 1; index > 0; index--) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
		}
		return shuffled;
	}

	function itemMatchesPool(item, pool) {
		if (pool.enabled === false) return false;
		const itemCategories = item.customCategories ?? getSymbaroumItemCategories(item);
		if (itemCategories.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY)) return false;
		if (itemCategories.length) return itemHasSymbaroumCategory({ ...item, customCategories: itemCategories }, pool);
		if (Array.isArray(pool.itemTypes) && pool.itemTypes.length && !pool.itemTypes.includes(item.type)) return false;
		if (Array.isArray(pool.customCategories) && pool.customCategories.length) {
			if (!itemCategories.length || !itemHasSymbaroumCategory({ ...item, customCategories: itemCategories }, pool)) return false;
		}
		if (Array.isArray(pool.sourceModules) && pool.sourceModules.length && !pool.sourceModules.includes(item.moduleId)) return false;
		const folderIds = getAllowedWorldFolderIds(pool);
		if (folderIds && item.folderId !== undefined && !folderIds.has(item.folderId)) return false;
		if (pool.search) {
			const searchableText = `${item.name} ${item.reference} ${item.sourceDocument} ${item.modules}`.toLowerCase();
			const terms = pool.search.toLowerCase().split(/\s+/).filter(Boolean);
			if (terms.length && !terms.some(term => searchableText.includes(term))) return false;
		}

		const cost = getCatalogCost(item);
		if (!pool.includeNoCost && cost === null) return false;
		if (cost !== null && pool.minCost !== "" && pool.minCost !== null && pool.minCost !== undefined && cost < Number(pool.minCost)) return false;
		if (cost !== null && pool.maxCost !== "" && pool.maxCost !== null && pool.maxCost !== undefined && cost > Number(pool.maxCost)) return false;
		return true;
	}

	function getPoolItems(pool) {
		const selectedItems = new Set(Array.isArray(pool.selectedItems) ? pool.selectedItems : []);
		const worldItems = getWorldItems();
		const matches = selectedItems.size
			? [
				...worldItems.filter(item => !item.customCategories?.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY) && selectedItems.has(getItemKey(item))),
				...worldItems.filter(item => item.customCategories?.length && itemMatchesPool(item, pool)),
				...merchantCatalog.filter(item => selectedItems.has(getCatalogKey(item)))
			]
			: (() => {
				const worldMatches = worldItems.filter(item => itemMatchesPool(item, pool));
				return worldMatches.length ? worldMatches : merchantCatalog.filter(item => itemMatchesPool(item, pool));
			})();
		const uniqueItems = new Map(matches.map(item => [getItemKey(item), item]));
		const maxItems = Math.max(Number(pool.maxItems) || uniqueItems.size, 0);
		return shuffleItems([...uniqueItems.values()]).slice(0, maxItems);
	}

	function addGeneratedItemsToPreview(generatedItems) {
		itemsRolled.update((items) => {
			generatedItems.forEach((newItem) => {
				const existingItem = items.find(item => item.documentUuid === newItem.documentUuid);
				if (existingItem) {
					existingItem.quantity += newItem.quantity;
				} else {
					items.push(newItem);
				}
			});
			items.sort((a, b) => a.description < b.description ? -1 : 1);
			return items;
		});
	}

	async function generateMerchantStock() {
		if (!selectedMerchantCategory) return;
		if (!keepRolled) {
			itemsRolled.set([]);
		}
		rolledItemsRemoveExisting = selectedMerchantCategory.clearExisting !== false;

		const generatedItems = [];
		const pools = Array.isArray(selectedMerchantCategory.pools) ? selectedMerchantCategory.pools : [];

		for (const pool of pools.filter(pool => pool.enabled !== false)) {
			const chance = Number(pool.chance) || 100;
			if (Math.random() * 100 > chance) continue;

			for (const sourceItem of getPoolItems(pool)) {
				const item = sourceItem.item instanceof Item
					? sourceItem.item
					: sourceItem.uuid
						? await foundry.utils.fromUuid(sourceItem.uuid)
						: null;
				const itemData = item ?? foundry.utils.deepClone(sourceItem.itemData);
				if (!itemData) continue;
				const randomizedPrice = randomizeSymbaroumStockPrice(sourceItem.cost ?? foundry.utils.getProperty(itemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE));
				const generatedItemData = randomizedPrice && item instanceof Item
					? item.toObject()
					: itemData;
				if (randomizedPrice) {
					foundry.utils.setProperty(generatedItemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE, randomizedPrice);
				}

				const generatedItem = {
					description: sourceItem.name,
					documentUuid: sourceItem.uuid,
					img: sourceItem.img || generatedItemData.img,
					item: generatedItemData,
					quantity: randomQuantity(pool)
				};

				if (randomizedPrice) {
					generatedItem.price = randomizedPrice;
				} else if (item instanceof Item) {
					const prices = game.itempiles.API.getPricesForItem(item, { seller: store.actor });
					generatedItem.price = prices[0]?.free ? localize("ITEM-PILES.Merchant.ItemFree") : prices[0]?.priceString;
				} else {
					generatedItem.price = sourceItem.cost || "";
				}
				generatedItems.push(generatedItem);
			}
		}

		if (!generatedItems.length) {
			custom_warning(localize("ITEM-PILES.Merchant.NoMerchantCategoryItems"), true);
			return;
		}

		addGeneratedItemsToPreview(generatedItems);
		timesRolled = generatedItems.reduce((total, item) => total + item.quantity, 0);
	}

	function recurseThroughFoldersForTables(folderId) {
		const folder = game.folders.find(f => f.type === "RollTable" && f.id === folderId);
		let folders = [folder.id];
		for (const child of folder.children) {
			folders = folders.concat(recurseThroughFoldersForTables(child.folder.id))
		}
		return folders;
	}

	function getTables() {
		let tables = Array.from(game.tables);
		const folderId = getSetting(SETTINGS.POPULATION_TABLES_FOLDER);
		if (
			folderId !== "root" && game.folders.find((f) => f.type === "RollTable" && f.id === folderId)
		) {
			const folderIds = recurseThroughFoldersForTables(folderId)
			tables = tables.filter((t) => folderIds.includes(t.folder?.id));
		}

		const mappedTables = {};
		for (const table of tables) {
			mappedTables[table.uuid] = {
				name: table.name,
				items: Array.from(table.collections.results)
			}
		}
		return mappedTables;
	}

	async function rollAllTables() {
		if (!keepRolled) {
			itemsRolled.set([]);
		}
		rolledItemsRemoveExisting = false;
		for (const table of $populationTables) {
			table.open = false;
			await evaluateTable(table, true);
		}
		timesRolled = $itemsRolled.reduce((total, item) => {
			return total + item.quantity;
		}, 0);
	}

	async function evaluateTable(table, keepRolledItems) {

		const rollableTable = await foundry.utils.fromUuid(table.uuid);
		if (!rollableTable) return;

		if (!keepRolledItems) {
			itemsRolled.set([]);
		}
		rolledItemsRemoveExisting = false;

		const newItems = await PileUtilities.rollMerchantTables({ tableData: [table] });

		const processedItems = newItems.map(itemData => {
			const prices = game.itempiles.API.getPricesForItem(itemData.item, {
				seller: store.actor,
			});
			itemData.price = prices[0]?.free ? localize("ITEM-PILES.Merchant.ItemFree") : prices[0]?.priceString;
			return itemData;
		});

		itemsRolled.update((items) => {
			processedItems.forEach((newItem) => {
				const existingItem = items.find(
					(item) => item.documentUuid === newItem.documentUuid
				);
				if (existingItem) {
					existingItem.quantity += newItem.quantity;
				} else {
					items.push(newItem);
				}
			});
			items.sort((a, b) => {
				return a.description < b.description ? -1 : 1;
			});
			return items;
		});

	}

	async function addItem(itemToAdd) {
		await game.itempiles.API.addItems(store.actor, [itemToAdd].map(entry => ({
			item: entry.item,
			quantity: entry.quantity,
			flags: entry.flags
		})));
		removeItem(itemToAdd);
	}

	function removeItem(itemToRemove) {
		itemsRolled.update((items) => {
			const existingItemIndex = items.findIndex(
				(item) => item.documentUuid === itemToRemove.documentUuid
			);
			items.splice(existingItemIndex, 1);
			return items;
		});
	}

	async function addAllItems() {
		const itemsToAdd = get(itemsRolled).map(entry => ({
			item: entry.item,
			quantity: entry.quantity,
			flags: entry.flags
		}));
		await game.itempiles.API.addItems(store.actor, itemsToAdd, {
			removeExistingActorItems: rolledItemsRemoveExisting
		});
		itemsRolled.set([]);
		rolledItemsRemoveExisting = false;
	}

	async function clearAllItems(services = false) {
		const localization = services ? "Services" : "Items";
		const doContinue = await TJSDialog.confirm({
			title: "Item Piles - " + localize(`ITEM-PILES.Dialogs.ClearAll${localization}.Title`),
			content: {
				class: CustomDialog,
				props: {
					icon: "fas fa-exclamation-triangle",
					content: localize(`ITEM-PILES.Dialogs.ClearAll${localization}.Content`),
				},
			},
			modal: true,
			draggable: false,
			options: {
				height: "auto",
				headerButtonNoClose: true,
			},
		});
		if (!doContinue) return false;
		await game.itempiles.API.removeItems(store.actor, game.itempiles.API.getActorItems(store.actor)
			.filter(item => {
				const itemFlags = PileUtilities.getItemFlagData(item);
				return services === itemFlags.isService && !itemFlags.keepOnMerchant && !itemFlags.keepIfZero;
			}));
	}

	async function previewItem(itemData) {
		itemData.item?.sheet?.render(true);
	}

	async function removeAddedItem(itemToRemove) {
		store.actor.deleteEmbeddedDocuments("Item", [itemToRemove.item.id]);
	}

	function addTable() {
		populationTables.update((tabs) => {
			tabs.push({
				uuid: selectedTable,
				addAll: false,
				open: false,
				timesToRoll: "1d4-1",
				customCategory: "",
				items: {}
			});
			return tabs;
		});
	}

	async function removeTable(tableUuid) {

		const table = get(tables)[tableUuid];

		const doContinue = await TJSDialog.confirm({
			title: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.RemoveMerchantTable.Title"),
			content: {
				class: CustomDialog,
				props: {
					header: game.i18n.localize("ITEM-PILES.Dialogs.RemoveMerchantTable.Title"),
					content: game.i18n.format("ITEM-PILES.Dialogs.RemoveMerchantTable.Content", { table_name: table.name }),
					icon: "fas fa-exclamation-triangle"
				}
			},
			modal: true,
			draggable: false,
			rejectClose: false,
			defaultYes: true,
			options: {
				height: "auto"
			}
		});

		if (!doContinue) return;

		populationTables.update((tabs) => {
			return tabs.filter((t) => t.uuid !== tableUuid);
		});
	}

	let createId = Hooks.on("createRollTable", () => {
		tables.set(getTables());
	});
	let deleteId = Hooks.on("deleteRollTable", () => {
		tables.update(() => {
			const newTables = getTables();
			populationTables.update(values => values.filter((t) => newTables[t.uuid]));
			return newTables;
		});
	});

	onDestroy(() => {
		Hooks.off("createRollTable", createId);
		Hooks.off("deleteRollTable", deleteId);
	});

</script>

<div class="item-piles-flexrow" style="height:100%;">
	<div style="margin-right:0.5rem; max-width: 50%; max-height:100%; overflow-y:scroll;">
		{#if !(currentItems.length + currentServices.length)}
			<div class="item-piles-populate-header">
				{localize("ITEM-PILES.Merchant.BuyNoItems")}
			</div>
		{/if}

		{#if currentServices.length}
			<div class="item-piles-populate-header">
				{localize("ITEM-PILES.Merchant.CurrentServices")}
			</div>
		{/if}

		{#each currentServices as item (item.id)}
			<div
				class="item-piles-flexrow item-piles-item-row item-piles-even-color"
			>
				<ItemEntry {item} showQuantity={true}>
					<button
						slot="right"
						class="item-piles-rolled-item-button"
						style="color:red;"
						on:click={() => removeAddedItem(item)}
						data-fast-tooltip={localize("ITEM-PILES.Merchant.RemoveItem")}
					>
						<i class="fas fa-trash"/>
					</button>
				</ItemEntry>
			</div>
		{/each}

		{#if currentServices.length}
			<button class="item-piles-button" style="margin:5px 0;" on:click={() => clearAllItems(true)}>
				<i class="fas fa-trash"/>
				{localize("ITEM-PILES.Merchant.ClearAllServices")}
			</button>
		{/if}

		{#if currentItems.length}
			<div class="item-piles-populate-header">
				{localize("ITEM-PILES.Merchant.CurrentItems")}
			</div>
		{/if}

		{#each currentItems as item (item.id)}
			<div
				class="item-piles-flexrow item-piles-item-row item-piles-even-color"
			>
				<ItemEntry {item} showQuantity={true}>
					<button
						slot="right"
						class="item-piles-rolled-item-button"
						style="color:red;"
						on:click={() => removeAddedItem(item)}
						data-fast-tooltip={localize("ITEM-PILES.Merchant.RemoveItem")}
					>
						<i class="fas fa-trash"/>
					</button>
				</ItemEntry>
			</div>
		{/each}

		{#if currentItems.length}
			<button class="item-piles-button" style="margin:5px 0;" on:click={() => clearAllItems()}>
				<i class="fas fa-trash"/>
				{localize("ITEM-PILES.Merchant.ClearAllItems")}
			</button>
		{/if}
	</div>

	<div style="padding-right:0.25rem; max-width: 50%; max-height:100%; overflow-y:scroll;">

		<div class="item-piles-populate-header">
			<span style="flex:1 0 auto;">{localize("ITEM-PILES.Merchant.RollableTables")}</span>
			<button on:click={() => { rollAllTables() }}
			        style="height: 20px; line-height: inherit; font-size: 0.75rem; flex:1 0 auto; margin:0;">
				<i class="fas fa-dice-d20"></i> {localize("ITEM-PILES.Merchant.RollAllTables")}
			</button>
		</div>

		{#each $populationTables.filter(table => $tables[table.uuid]) as table}
			<div class="item-piles-item-row item-piles-even-color"
			     style="min-height: 28px; padding: 3px 3px 3px 5px;">
				<div class="item-piles-flexrow" style="align-items: center;">
					<div style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">
						<strong style="max-width:100%; word-break: break-all;">{$tables[table.uuid].name}</strong>
					</div>
					<button class="item-piles-rolled-item-button"
					        on:click={() => { removeTable(table.uuid) }}
					        data-fast-tooltip={localize("ITEM-PILES.Merchant.ToolTipRemoveTable")}
					>
						<i class="fas fa-trash" style="color:#de0e0e;"></i>
					</button>
					<button class="item-piles-rolled-item-button"
					        on:click={() => { table.open = !table.open; }}
					        data-fast-tooltip={localize("ITEM-PILES.Merchant.TooltipConfigureTable")}
					>
						<i class="fas fa-cog"></i>
					</button>
					<button class="item-piles-rolled-item-button"
					        on:click={() => { table.open = false; evaluateTable(table, keepRolled); }}
					        data-fast-tooltip={localize("ITEM-PILES.Merchant.TooltipRollTable")}
					        style="margin-right:0;">
						<i class="fas fa-dice-d20"></i>
					</button>
				</div>
				{#if table.open}
					<div class="item-piles-flexcol" style="margin-top:5px;"
					     transition:slide={{ duration: 200, easing: quintOut }}>
						<div class="item-piles-flexrow" style="align-items: center; margin-bottom: 0.25rem;">
							<label
								style="margin-right:5px;">{localize("ITEM-PILES.Merchant.TableCustomCategory")}</label>
							<CustomCategoryInput bind:value={table.customCategory}/>
						</div>
						<div class="item-piles-flexrow">
							<div class="item-piles-flexrow" style="align-items: center; flex:0 1 auto; min-height:26px;">
								<label style="flex:0 1 auto; margin-right:5px;"
								       for={"table-id-"+table.uuid}>{localize("ITEM-PILES.Merchant.TableAddAllItems")}</label>
								<input style="width:15px; height:15px; margin:0; flex:0;" id={"table-id-"+table.uuid}
								       bind:checked={table.addAll}
								       on:change={() => {
                           if(!table.addAll){
															table.items = [];
															return;
                           }
                           table.items = Object.fromEntries($tables[table.uuid].items.map(item => [item.id, table.timesToRoll]));
                         }}
								       type="checkbox"/>
							</div>
							{#if !table.addAll}
								<div class="item-piles-flexrow item-piles-item-row" style="align-items: center; flex:1;">
									<label
										style="margin-right:5px; text-align: right;">{localize("ITEM-PILES.Merchant.TableTimesToRoll")}</label>
									<input type="text" placeholder="2d6+4" bind:value={table.timesToRoll}
									       style="height:20px; margin: 3px; max-width: 50px; font-size: 0.75rem;"
									/>
								</div>
							{/if}
						</div>
						{#if table.addAll}
							{#each $tables[table.uuid].items as item (item.id)}
								<div class="item-piles-flexrow item-piles-item-row item-piles-odd-color">
									<div class="item-piles-img-container">
										<img class="item-piles-img" src={item.img}/>
									</div>

									<div class="item-piles-name item-piles-text">
										<div class="item-piles-name-container">
											<a class="item-piles-clickable" on:click={() => previewItem(item)}>
												{(item.description ?? item.text) || item.name}
											</a>
										</div>
									</div>

									<div class="item-piles-quantity-container" style="flex:0 1 75px;">
										<div class="item-piles-quantity-input-container">
											<input
												class="item-piles-quantity"
												type="text"
												value={(table?.items?.[item.id] ?? "1d4")}
												on:change={(event) => {
                            table.items[item.id] = event.target.value;
                          }}
											/>
										</div>
									</div>

								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/each}

		<div class="item-piles-flexrow" style="margin-top: 0.5rem; flex-wrap:nowrap;">

			<select bind:value={selectedTable} style="max-width: calc(100% - 81px);">
				{#each selectableTables as [tableUuid, table] (tableUuid)}
					<option value={tableUuid}>{table.name}</option>
				{/each}
				{#if foundry.utils.isEmpty($tables)}
					<option value="">
						{localize("ITEM-PILES.Merchant.NoRollTables")}
					</option>
				{/if}
			</select>

			<button class="item-piles-button" on:click={() => addTable()} style="max-width:80px; min-width:80px;">
				{localize("ITEM-PILES.Merchant.AddTable")}
			</button>

		</div>

		<hr style="margin:5px 0;"/>

		{#if enabledMerchantItemCategories.length}
			<div class="item-piles-populate-header">
				<span style="flex:1 0 auto;">{localize("ITEM-PILES.Merchant.MerchantCategories")}</span>
				<button on:click={() => { generateMerchantStock() }}
				        style="height: 20px; line-height: inherit; font-size: 0.75rem; flex:1 0 auto; margin:0;">
					<i class="fas fa-store"></i> {localize("ITEM-PILES.Merchant.GenerateStock")}
				</button>
			</div>

			<div class="item-piles-flexrow" style="margin-bottom: 0.5rem; flex-wrap:nowrap;">
				<select bind:value={selectedMerchantCategoryId} style="max-width: 100%;">
					{#each enabledMerchantItemCategories as category (category.id)}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>

			<hr style="margin:5px 0;"/>
		{/if}

		<div class="item-piles-flexrow item-piles-roll-header">
			<label>
				{localize(
					timesRolled && $itemsRolled.length
						? "ITEM-PILES.Merchant.RolledTimes"
						: "ITEM-PILES.Merchant.ClickRoll",
					{ rolls: timesRolled }
				)}
			</label>

			<div class="item-piles-flexrow item-piles-keep-rolled">
				<label>{localize("ITEM-PILES.Merchant.KeepRolled")}</label>
				<input bind:checked={keepRolled} type="checkbox"/>
			</div>
		</div>

		{#if $itemsRolled.length}

			<div class="item-piles-flexrow" style="margin:5px 0;">

				<button class="item-piles-button" on:click={() => addAllItems()}>
					{localize("ITEM-PILES.Merchant.AddAll")}
					<i class="fas fa-arrow-left"/>
				</button>

				<button class="item-piles-button"
				        style="color:red; max-width:30px;"
				        on:click={() => { $itemsRolled = []; }}
				        data-fast-tooltip={localize("ITEM-PILES.Merchant.ToolTipRemoveAllRolledItems")}>
					<i class="fas fa-trash"/>
				</button>

			</div>
			{#each $itemsRolled as item (item.documentUuid)}
				<div
					class="item-piles-flexrow item-piles-item-row item-piles-even-color"
				>
					<button
						class="item-piles-rolled-item-button"
						on:click={() => addItem(item)}
						data-fast-tooltip={localize("ITEM-PILES.Merchant.AddItem")}
					>
						<i class="fas fa-arrow-left"/>
					</button>

					<div class="item-piles-img-container">
						<img class="item-piles-img" src={item.img}/>
					</div>

					<div class="item-piles-name">
						<div class="item-piles-name-container">
							<a class="item-piles-clickable" on:click={(_) => previewItem(item)}>
								{item.description}
							</a>
						</div>
					</div>

					<div class="item-piles-quantity-container">
						{#if item.price}
							<small style="white-space: nowrap;">{item.price}</small>
							<i
								class="fas fa-times"
								style="color: #555; font-size: 0.75rem; opacity: 0.75;"
							/>
						{/if}
						<div class="item-piles-quantity-input-container">
							<input
								class="item-piles-quantity"
								type="number"
								min="0"
								bind:value={item.quantity}
							/>
						</div>
					</div>

					<button
						class="item-piles-rolled-item-button"
						style="color:red;"
						on:click={() => removeItem(item)}
						data-fast-tooltip={localize("ITEM-PILES.Merchant.RemoveItem")}
					>
						<i class="fas fa-trash"/>
					</button>
				</div>
			{/each}
		{/if}

	</div>
</div>

<style lang="scss">

  .item-piles-populate {

    &-header {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: 5px;
      align-items: center;
      min-height: 20px;
      margin: 0.125rem 0 0.5rem 0;
    }
  }

  .item-piles-roll-header {
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .item-piles-keep-rolled {
    align-items: center;
    justify-content: flex-end;
    font-size: 0.75rem;
    text-align: right;
    flex: 0 1 auto;

    input {
      height: 14px;
    }
  }

  .item-piles-name {
    flex: 1 0 auto;
  }

  .item-piles-quantity-container {
    flex: 0 1 50px;
    gap: 4px;
  }

  .item-piles-button {
    height: 27px;
    line-height: inherit;

    /* alignt icons */
    flex-direction: row;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
  }

  .item-piles-rolled-item-button {
    min-height: 22px;
    min-width: 22px;
    margin: 2px;
    font-size: 0.65rem;
    padding: 0.25rem;
    flex: 0;
    line-height: inherit;

    i {
      margin: 0;
    }
  }

  .fix-height-checkbox {
    height: 20px;
  }

  .item-piles-header-button {
    min-width: 30px;
    height: 30px;
    text-align: center;
    padding: 0;
    margin: 0;
  }

  .item-piles-remove-button {
    font-size: 0.75rem;
    width: 30px;
    height: 30px;
    align-items: center;
    display: flex;
    justify-content: center;

    color: red;

    &[disabled] {
      color: gray;
    }
  }

  .item-piles-quantity-input-container {
    min-width: 40px;
  }
</style>

