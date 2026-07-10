<script>
	import { ApplicationShell } from "#runtime/svelte/component/application";
	import { getContext } from "svelte";
	import { localize } from "#runtime/util/i18n";
	import * as Helpers from "../../../helpers/helpers.js";
	import SETTINGS from "../../../constants/settings.js";
	import CONSTANTS from "../../../constants/constants.js";
	import {
		getSymbaroumItemCategories,
		itemHasSymbaroumCategory
	} from "../../../helpers/symbaroum-item-categories.js";

	const { application } = getContext("#external");

	export let elementRoot;
	export let data;

	const itemGroups = Helpers.getSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES, [])
		.map(group => typeof group === "string" ? { id: group, name: group, selectedItems: [] } : group)
		.filter(group => group?.name)
		.sort((a, b) => a.name.localeCompare(b.name));

	let form;
	let categories = normalizeCategories(foundry.utils.deepClone(data ?? []));
	let activeCategoryId = categories[0]?.id ?? "";
	let showGroupPicker = false;
	let groupSearch = "";

	$: activeCategory = categories.find(category => category.id === activeCategoryId) ?? categories[0];
	$: activePoolIds = new Set((activeCategory?.pools ?? []).map(pool => pool.groupId ?? pool.id));
	$: availableGroups = itemGroups
		.filter(group => !activePoolIds.has(group.id))
		.filter(group => !groupSearch.trim() || group.name.toLowerCase().includes(groupSearch.toLowerCase().trim()));

	function normalizeCategories(source) {
		const list = Array.isArray(source) ? source : [];
		return list.map(category => ({
			id: category.id || foundry.utils.randomID(),
			name: category.name || localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.NewCategory"),
			description: category.description || "",
			enabled: category.enabled ?? true,
			clearExisting: category.clearExisting ?? true,
			pools: normalizePools(category.pools)
		}));
	}

	function normalizePools(source) {
		const list = Array.isArray(source) ? source : [];
		return list.map(pool => {
			const group = itemGroups.find(group => group.id === (pool.groupId ?? pool.id));
			const normalized = group ? foundry.utils.deepClone(group) : {};
			return {
				...normalized,
				...pool,
				id: pool.id || foundry.utils.randomID(),
				groupId: pool.groupId ?? group?.id ?? pool.id,
				name: group?.name ?? pool.name ?? localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.NewPool"),
				enabled: pool.enabled ?? true,
				itemTypes: group?.itemTypes ?? pool.itemTypes ?? [],
				customCategories: group?.customCategories ?? pool.customCategories ?? [],
				sourceModules: group?.sourceModules ?? pool.sourceModules ?? [],
				worldFolders: group?.worldFolders ?? pool.worldFolders ?? [],
				search: group?.search ?? pool.search ?? "",
				minCost: group?.minCost ?? pool.minCost ?? "",
				maxCost: group?.maxCost ?? pool.maxCost ?? "",
				includeNoCost: group?.includeNoCost ?? pool.includeNoCost ?? true,
				maxItems: Number(pool.maxItems ?? group?.maxItems ?? 10),
				minQuantity: Number(pool.minQuantity ?? group?.minQuantity ?? 1),
				maxQuantity: Number(pool.maxQuantity ?? group?.maxQuantity ?? 1),
				chance: Number(pool.chance ?? group?.chance ?? 100),
				selectedItems: Array.isArray(group?.selectedItems)
					? [...group.selectedItems]
					: Array.isArray(pool.selectedItems) ? [...pool.selectedItems] : []
			};
		});
	}

	function addCategory() {
		const category = {
			id: foundry.utils.randomID(),
			name: localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.NewCategory"),
			description: "",
			enabled: true,
			clearExisting: true,
			pools: []
		};
		categories = [...categories, category];
		activeCategoryId = category.id;
		showGroupPicker = true;
	}

	function duplicateCategory(category) {
		const clone = foundry.utils.deepClone(category);
		clone.id = foundry.utils.randomID();
		clone.name = `${clone.name} Copy`;
		clone.pools = clone.pools.map(pool => ({ ...pool, id: foundry.utils.randomID() }));
		categories = [...categories, clone];
		activeCategoryId = clone.id;
		showGroupPicker = false;
	}

	function removeCategory(category) {
		categories = categories.filter(entry => entry !== category);
		activeCategoryId = categories[0]?.id ?? "";
		showGroupPicker = false;
	}

	function addPoolFromGroup(group, category = activeCategory) {
		if (!category) return;
		const pool = {
			...foundry.utils.deepClone(group),
			id: foundry.utils.randomID(),
			groupId: group.id,
			name: group.name,
			enabled: true
		};
		category.pools = [...category.pools, pool];
		categories = categories;
		showGroupPicker = false;
		groupSearch = "";
	}

	function removePool(pool) {
		if (!activeCategory) return;
		activeCategory.pools = activeCategory.pools.filter(entry => entry !== pool);
		categories = categories;
	}

	function getGroupItemCount(groupOrPool) {
		const sourceGroup = itemGroups.find(group => group.id === (groupOrPool.groupId ?? groupOrPool.id)) ?? groupOrPool;
		const selectedItems = new Set(sourceGroup.selectedItems ?? []);
		if (sourceGroup.manualSelection || sourceGroup.selectedItems?.length) {
			return getWorldItems()
				.filter(item => !item.customCategories?.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY))
				.filter(item => selectedItems.has(item.uuid) || itemMatchesGroup(item, sourceGroup))
				.length;
		}
		return getWorldItems().filter(item => itemMatchesGroup(item, sourceGroup)).length;
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
			folderId: item.folder?.id ?? "",
			uuid: item.uuid
		}));
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
		const folderIds = getAllowedWorldFolderIds(group);
		if (folderIds && item.folderId !== undefined && !folderIds.has(item.folderId)) return false;
		if (group.search) {
			const searchableText = `${item.name} ${item.reference ?? ""} ${item.cost ?? ""}`.toLowerCase();
			const terms = group.search.toLowerCase().split(/\s+/).filter(Boolean);
			if (terms.length && !terms.some(term => searchableText.includes(term))) return false;
		}
		return true;
	}

	async function updateSettings() {
		application.options.resolve(categories);
		application.close();
	}

	export function requestSubmit() {
		form.requestSubmit();
	}
</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete="off" bind:this={form} on:submit|preventDefault={updateSettings}>
		<div class="merchant-category-editor">
			<aside>
				<div class="toolbar">
					<strong>Tipos de comerciante</strong>
					<button type="button" on:click={addCategory}><i class="fas fa-plus"></i></button>
				</div>
				{#each categories as category (category.id)}
					<button type="button"
					        class:active={category.id === activeCategoryId}
					        class:disabled={!category.enabled}
					        on:click={() => {
					          activeCategoryId = category.id;
					          showGroupPicker = false;
					        }}>
						<span>{category.name}</span>
						<small>{category.pools.length} grupos</small>
					</button>
				{/each}
			</aside>

			{#if activeCategory}
				<section class="main">
					<header>
						<div>
							<input class="title-input" bind:value={activeCategory.name} required>
							<textarea bind:value={activeCategory.description} rows="3" placeholder={localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.Description")}></textarea>
						</div>
						<div class="header-actions">
							<label><input type="checkbox" bind:checked={activeCategory.enabled}> {localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.Enabled")}</label>
							<label><input type="checkbox" bind:checked={activeCategory.clearExisting}> {localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.ClearExisting")}</label>
							<div class="icon-row">
								<button type="button" on:click={() => duplicateCategory(activeCategory)}><i class="fas fa-copy"></i></button>
								<button type="button" on:click={() => removeCategory(activeCategory)}><i class="fas fa-times"></i></button>
							</div>
						</div>
					</header>

					<div class="groups-panel">
						<div class="panel-header">
							<strong>Grupos de itens que este comerciante vende</strong>
							<button type="button" on:click={() => showGroupPicker = !showGroupPicker}><i class="fas fa-plus"></i></button>
						</div>

						<div class="selected-groups">
							{#each activeCategory.pools as pool (pool.id)}
								<div class="group-row" class:disabled={!pool.enabled}>
									<div>
										<strong>{pool.name}</strong>
										<small>{getGroupItemCount(pool)} itens no grupo</small>
									</div>
									<label><input type="checkbox" bind:checked={pool.enabled}> Ativo</label>
									<button type="button" on:click={() => removePool(pool)}><i class="fas fa-times"></i></button>
								</div>
							{/each}
							{#if !activeCategory.pools.length}
								<div class="empty-state">Nenhum grupo de itens adicionado.</div>
							{/if}
						</div>

						{#if showGroupPicker}
							<div class="group-picker">
								<div class="picker-header">
									<strong>Adicionar grupo de itens</strong>
									<input bind:value={groupSearch} placeholder="Buscar grupo">
								</div>
								<div class="available-groups">
									{#each availableGroups as group (group.id)}
										<button type="button" on:click={() => addPoolFromGroup(group)}>
											<span>{group.name}</span>
											<small>{getGroupItemCount(group)} itens</small>
											<i class="fas fa-plus"></i>
										</button>
									{/each}
									{#if !availableGroups.length}
										<div class="empty-state">Nenhum grupo disponível.</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</section>
			{:else}
				<section class="empty-state">
					<button type="button" on:click={addCategory}><i class="fas fa-plus"></i> {localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.AddCategory")}</button>
				</section>
			{/if}
		</div>

		<footer>
			<button on:click|once={requestSubmit} type="button">
				<i class="far fa-save"></i> {localize("Save")}
			</button>
			<button on:click|once={() => application.close()} type="button">
				<i class="far fa-times"></i> {localize("Cancel")}
			</button>
		</footer>
	</form>
</ApplicationShell>

<style lang="scss">
  .merchant-category-editor {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 10px;
    height: 660px;
  }

  aside {
    border-right: 1px solid rgba(0, 0, 0, 0.25);
    padding-right: 8px;
    overflow-y: auto;
  }

  .toolbar, header, footer, .panel-header, .picker-header, .group-row, .icon-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar, .panel-header {
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

  .disabled {
    opacity: 0.55;
  }

  small {
    opacity: 0.75;
  }

  .main {
    min-width: 0;
    overflow-y: auto;
    padding-right: 4px;
  }

  header {
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    padding-bottom: 8px;
    margin-bottom: 10px;
  }

  header > div:first-child {
    flex: 1;
  }

  .title-input {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  textarea {
    resize: vertical;
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 190px;
  }

  .groups-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .selected-groups, .available-groups {
    overflow-y: auto;
    border: 1px solid rgba(0, 0, 0, 0.25);
  }

  .selected-groups {
    max-height: 300px;
  }

  .available-groups {
    max-height: 220px;
  }

  .group-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 28px;
    align-items: center;
    padding: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  }

  .group-row > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .group-row strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .group-row button {
    height: 24px;
    margin: 0;
    padding: 0;
  }

  .group-picker {
    border-top: 1px solid rgba(0, 0, 0, 0.25);
    padding-top: 8px;
  }

  .picker-header {
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .picker-header input {
    flex: 0 1 260px;
  }

  .available-groups button {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 28px;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin: 0;
    border-width: 0 0 1px;
  }

  .available-groups span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
    opacity: 0.75;
  }

  footer {
    justify-content: flex-end;
    border-top: 1px solid rgba(0, 0, 0, 0.25);
    margin-top: 8px;
    padding-top: 8px;
  }
</style>
