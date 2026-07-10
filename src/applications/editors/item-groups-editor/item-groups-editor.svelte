<script>
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import { getContext } from "svelte";
	import { localize } from "#runtime/util/i18n";
	import CONSTANTS from "../../../constants/constants.js";
	import {
		getSymbaroumItemCategories,
		itemHasSymbaroumCategory
	} from "../../../helpers/symbaroum-item-categories.js";

	const { application } = getContext("#external");

	export let elementRoot;
	export let data;

	let form;
	let groups = normalizeGroups(foundry.utils.deepClone(data ?? []));
	let activeGroupId = groups[0]?.id ?? "";
	let itemSearch = "";
	let itemType = "";

	$: worldItems = getWorldItems();
	$: itemTypes = Array.from(new Set(worldItems.map(item => item.type))).sort();
	$: activeGroup = groups.find(group => group.id === activeGroupId) ?? groups[0];
	$: selectedItems = activeGroup ? getSelectedItems(activeGroup) : [];
	$: availableItems = activeGroup ? getVisibleItems(activeGroup, itemSearch, itemType) : [];

	function normalizeGroups(source) {
		const list = Array.isArray(source) ? source : [];
		return list.map(group => {
			const normalized = typeof group === "string"
				? createGroup(group)
				: {
					...createGroup(group.name),
					...group,
					id: group.id || foundry.utils.randomID(),
					name: group.name || localize("ITEM-PILES.Applications.ItemGroupsEditor.NewGroup"),
					itemTypes: Array.isArray(group.itemTypes) ? group.itemTypes : [],
					customCategories: Array.isArray(group.customCategories) ? group.customCategories : [],
					sourceModules: Array.isArray(group.sourceModules) ? group.sourceModules : [],
					worldFolders: Array.isArray(group.worldFolders) ? group.worldFolders : [],
					selectedItems: Array.isArray(group.selectedItems) ? group.selectedItems : [],
					manualSelection: group.manualSelection ?? false
				};

			if (!normalized.manualSelection && !normalized.selectedItems.length) {
				normalized.selectedItems = getFilteredWorldItems(normalized).map(itemKey);
			}

			return normalized;
		});
	}

	function createGroup(name = localize("ITEM-PILES.Applications.ItemGroupsEditor.NewGroup")) {
		return {
			id: foundry.utils.randomID(),
			name,
			enabled: true,
			itemTypes: [],
			customCategories: [],
			sourceModules: [],
			worldFolders: [],
			search: "",
			minCost: "",
			maxCost: "",
			includeNoCost: true,
			maxItems: 10,
			minQuantity: 1,
			maxQuantity: 1,
			chance: 100,
			selectedItems: [],
			manualSelection: false
		};
	}

	function itemKey(item) {
		return item.uuid ?? [item.name, item.type, item.cost, item.reference, item.state, item.img].join("|");
	}

	function getWorldItemCost(item) {
		return foundry.utils.getProperty(item, game.itempiles.API.ITEM_PRICE_ATTRIBUTE) ?? "";
	}

	function getWorldItemCustomCategories(item) {
		return getSymbaroumItemCategories(item);
	}

	function getWorldItems() {
		return Array.from(game.items ?? []).map(item => ({
			name: item.name,
			type: item.type,
			cost: getWorldItemCost(item),
			reference: foundry.utils.getProperty(item, "system.reference") ?? "",
			customCategories: getWorldItemCustomCategories(item),
			img: item.img,
			uuid: item.uuid,
			folderId: item.folder?.id ?? "",
			source: "world"
		})).sort((a, b) => a.name.localeCompare(b.name));
	}

	function getFolderAndChildIds(folderId) {
		const folder = game.folders.get(folderId);
		if (!folder) return [];
		return [folder.id, ...folder.children.flatMap(child => getFolderAndChildIds(child.folder.id))];
	}

	function getAllowedWorldFolderIds(group) {
		if (!Array.isArray(group.worldFolders) || !group.worldFolders.length) return null;
		return new Set(group.worldFolders.flatMap(getFolderAndChildIds));
	}

	function itemMatchesGroup(item, group) {
		if (item.customCategories?.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY)) return false;
		if (item.customCategories?.length) return itemHasSymbaroumCategory(item, group);
		if (Array.isArray(group.itemTypes) && group.itemTypes.length && !group.itemTypes.includes(item.type)) return false;
		if (Array.isArray(group.customCategories) && group.customCategories.length) {
			if (!item.customCategories?.length || !itemHasSymbaroumCategory(item, group)) return false;
		}
		if (Array.isArray(group.sourceModules) && group.sourceModules.length && !group.sourceModules.includes(item.moduleId)) return false;
		const folderIds = getAllowedWorldFolderIds(group);
		if (folderIds && item.folderId !== undefined && !folderIds.has(item.folderId)) return false;
		if (group.search) {
			const searchableText = `${item.name} ${item.reference ?? ""} ${item.cost ?? ""}`.toLowerCase();
			const terms = group.search.toLowerCase().split(/\s+/).filter(Boolean);
			if (terms.length && !terms.some(term => searchableText.includes(term))) return false;
		}
		return true;
	}

	function getFilteredWorldItems(group) {
		return getWorldItems().filter(item => itemMatchesGroup(item, group));
	}

	function getVisibleItems(group, search, type) {
		const selected = new Set(group.selectedItems ?? []);
		const query = search.toLowerCase().trim();
		return getWorldItems()
			.filter(item => !type || item.type === type)
			.filter(item => !item.customCategories?.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY))
			.filter(item => !selected.has(itemKey(item)) && !itemMatchesGroup(item, group))
			.filter(item => !query || `${item.name} ${item.type} ${item.cost} ${(item.customCategories ?? []).join(" ")}`.toLowerCase().includes(query))
			.slice(0, 500);
	}

	function getSelectedItems(group) {
		const selected = new Set(group?.selectedItems ?? []);
		return getWorldItems()
			.filter(item => !item.customCategories?.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY))
			.filter(item => selected.has(itemKey(item)) || itemMatchesGroup(item, group));
	}

	function addGroup() {
		const group = createGroup();
		groups = [...groups, group];
		activeGroupId = group.id;
	}

	function removeGroup(group) {
		groups = groups.filter(entry => entry !== group);
		activeGroupId = groups[0]?.id ?? "";
	}

	function duplicateGroup(group) {
		const clone = foundry.utils.deepClone(group);
		clone.id = foundry.utils.randomID();
		clone.name = `${clone.name} Copy`;
		groups = [...groups, clone];
		activeGroupId = clone.id;
	}

	function addSelectedItem(item) {
		const selected = new Set(activeGroup.selectedItems);
		selected.add(itemKey(item));
		activeGroup.selectedItems = Array.from(selected);
		activeGroup.manualSelection = true;
		groups = groups;
	}

	function removeSelectedItem(item) {
		const selected = new Set(activeGroup.selectedItems);
		selected.delete(itemKey(item));
		activeGroup.selectedItems = Array.from(selected);
		activeGroup.manualSelection = true;
		groups = groups;
	}

	async function updateSettings() {
		application.options.resolve(groups);
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}
</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete="off" bind:this={form} on:submit|preventDefault={updateSettings}>
		<div class="item-group-editor">
			<aside>
				<div class="toolbar">
					<strong>Grupos de itens</strong>
					<button type="button" on:click={addGroup}><i class="fas fa-plus"></i></button>
				</div>
				{#each groups as group (group.id)}
					<button type="button" class:active={group.id === activeGroupId} class:disabled={!group.enabled} on:click={() => activeGroupId = group.id}>
						<span>{group.name}</span>
						<small>{getSelectedItems(group).length} itens</small>
					</button>
				{/each}
			</aside>

			{#if activeGroup}
				<section class="main">
					<header>
						<input class="title-input" bind:value={activeGroup.name} required>
						<label><input type="checkbox" bind:checked={activeGroup.enabled}> {localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.Enabled")}</label>
						<button type="button" on:click={() => duplicateGroup(activeGroup)}><i class="fas fa-copy"></i></button>
						<button type="button" on:click={() => removeGroup(activeGroup)}><i class="fas fa-times"></i></button>
					</header>

					<div class="summary">
						<strong>{selectedItems.length}</strong><span>itens no grupo</span>
						<strong>{worldItems.length}</strong><span>itens encontrados no mundo</span>
					</div>

					<section class="list-section selected-section">
						<div class="section-title">Itens do grupo</div>
						<div class="item-list selected-list">
							{#each selectedItems as item (itemKey(item))}
								<div class="item-row selected">
									<span>{item.name}</span>
									<small>{item.type} - {item.cost || "-"}</small>
									<button type="button" on:click={() => removeSelectedItem(item)}><i class="fas fa-times"></i></button>
								</div>
							{/each}
						</div>
					</section>

					<section class="list-section">
						<div class="catalog-filters">
							<div class="section-title">Itens do mundo</div>
							<input bind:value={itemSearch} placeholder="Buscar nos itens do mundo">
							<select bind:value={itemType}>
								<option value="">{localize("ITEM-PILES.Merchant.AllTypes")}</option>
								{#each itemTypes as type}<option value={type}>{type}</option>{/each}
							</select>
						</div>
						<div class="item-list available-list">
							{#each availableItems as item (itemKey(item))}
								<div class="item-row">
									<span>{item.name}</span>
									<small>{item.type} - {item.cost || "-"}</small>
									<button type="button" on:click={() => addSelectedItem(item)}><i class="fas fa-plus"></i></button>
								</div>
							{/each}
						</div>
					</section>
				</section>
			{/if}
		</div>

		<footer>
			<button on:click|once={requestSubmit} type="button"><i class="far fa-save"></i> {localize("Save")}</button>
			<button on:click|once={() => application.close()} type="button"><i class="far fa-times"></i> {localize("Cancel")}</button>
		</footer>
	</form>
</ApplicationShell>

<style lang="scss">
  .item-group-editor {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 10px;
    height: 660px;
  }

  aside {
    border-right: 1px solid rgba(0, 0, 0, 0.25);
    padding-right: 8px;
    overflow-y: auto;
  }

  .toolbar, header, footer, .catalog-filters {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar {
    justify-content: space-between;
    margin-bottom: 6px;
  }

  aside > button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    margin: 0 0 4px;
    line-height: 1.1;
  }

  button.active {
    box-shadow: inset 0 0 0 2px var(--item-piles-shadow-primary);
  }

  button.disabled {
    opacity: 0.55;
  }

  small {
    opacity: 0.75;
  }

  .main {
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-right: 4px;
  }

  header {
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .title-input {
    flex: 1;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .summary {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
    gap: 6px;
    padding: 6px;
    border: 1px solid rgba(0, 0, 0, 0.25);
    margin-bottom: 8px;
  }

  .list-section {
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }

  .selected-section {
    flex: 0 0 250px;
  }

  .section-title {
    font-weight: 700;
    margin-bottom: 6px;
  }

  .catalog-filters {
    margin-bottom: 6px;
  }

  .catalog-filters .section-title {
    margin: 0 auto 0 0;
  }

  .catalog-filters input {
    flex: 0 1 260px;
  }

  .item-list {
    overflow-y: auto;
    border: 1px solid rgba(0, 0, 0, 0.25);
  }

  .selected-list {
    height: 215px;
  }

  .available-list {
    height: 285px;
  }

  .item-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 28px;
    gap: 6px;
    align-items: center;
    padding: 4px 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  }

  .item-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-row button {
    height: 24px;
    margin: 0;
    padding: 0;
  }

  footer {
    justify-content: flex-end;
    border-top: 1px solid rgba(0, 0, 0, 0.25);
    margin-top: 8px;
    padding-top: 8px;
  }
</style>
