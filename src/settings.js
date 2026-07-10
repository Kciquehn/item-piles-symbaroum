import CONSTANTS from "./constants/constants.js";
import SETTINGS from "./constants/settings.js";
import * as Helpers from "./helpers/helpers.js";
import { SYSTEMS } from "./systems.js";
import { SettingsShim, SettingsApp } from "./applications/settings-app/settings-app.js";
import { TJSDialog } from "#runtime/svelte/application";
import CustomDialog from "./applications/components/CustomDialog.svelte";
import SYMBAROUM_MERCHANT_CATEGORIES from "./data/symbaroum-merchant-categories.js";
import SYMBAROUM_ITEM_GROUPS from "./data/symbaroum-item-groups.js";
import { getDefaultSymbaroumItemCategories } from "./helpers/symbaroum-item-categories.js";

export function registerSettings() {

	game.settings.registerMenu(CONSTANTS.MODULE_NAME, "configure-settings", {
		name: "ITEM-PILES.Settings.Configure.Title",
		label: "ITEM-PILES.Settings.Configure.Label",
		hint: "ITEM-PILES.Settings.Configure.Hint",
		icon: "fas fa-cog",
		type: SettingsShim,
		restricted: false
	});

	for (let [name, data] of Object.entries(SETTINGS.GET_DEFAULT())) {
		game.settings.register(CONSTANTS.MODULE_NAME, name, data);
	}

}

export async function applyDefaultSettings() {
	const settings = SETTINGS.GET_SYSTEM_DEFAULTS();
	for (const [name, data] of Object.entries(settings)) {
		await Helpers.setSetting(name, data.default);
	}
	await Helpers.setSetting(SETTINGS.SYSTEM_VERSION, SYSTEMS.DATA.VERSION ?? "");
	await patchCurrencySettings();
}

export async function applySoftMigration(migrationKey) {
	const migrationSettings = SYSTEMS.DATA.SOFT_MIGRATIONS[migrationKey];
	for (const [key, values] of Object.entries(migrationSettings)) {
		const settingsKey = SETTINGS[key];
		const currentSettingValue = Helpers.getSetting(settingsKey);
		await Helpers.setSetting(settingsKey, foundry.utils.mergeObject(currentSettingValue, values));
	}
	await Helpers.setSetting(SETTINGS.SYSTEM_VERSION, SYSTEMS.DATA.VERSION ?? "");
}

export async function patchCurrencySettings() {
	const currencies = Helpers.getSetting(SETTINGS.CURRENCIES);
	for (let currency of currencies) {
		if (currency.type !== "item" || !currency.data.uuid || currency.data.item) continue;
		const item = await foundry.utils.fromUuid(currency.data.uuid);
		if (!item) continue;
		currency.data.item = item.toObject();
	}
	return Helpers.setSetting(SETTINGS.CURRENCIES, currencies);
}

export async function patchMerchantItemCategories() {
	const categories = Helpers.getSetting(SETTINGS.MERCHANT_ITEM_CATEGORIES, []);
	const categoryIds = new Set((Array.isArray(categories) ? categories : []).map(category => category.id));
	const defaultIds = new Set(SYMBAROUM_MERCHANT_CATEGORIES.map(category => category.id));
	const hasOnlyOldGenericDefaults = categoryIds.size === 3
		&& categoryIds.has("armorer")
		&& categoryIds.has("weaponsmith")
		&& categoryIds.has("general-goods");
	const hasOfficialStoreDefaults = [
		"marvaloms",
		"corda-machado",
		"o-tesouro",
		"drogaria-taler",
		"kodomar",
		"mercado-brejonegro"
	].some(id => categoryIds.has(id));
	const hasPreviousGenericDefaults = [
		"generic-weapons",
		"generic-simple-weapons",
		"generic-complete-arms",
		"generic-armorer",
		"generic-expedition-supplier",
		"generic-alchemist",
		"generic-antiquarian",
		"generic-tavern-inn",
		"generic-general-store",
		"generic-luxury-merchant",
		"generic-monster-hunter",
		"generic-transport-builder"
	].some(id => categoryIds.has(id));

	if (Array.isArray(categories) && categories.length && !hasOnlyOldGenericDefaults && !hasOfficialStoreDefaults && !hasPreviousGenericDefaults) {
		const mergedCategories = foundry.utils.deepClone(categories);
		let changed = false;
		for (const defaultCategory of SYMBAROUM_MERCHANT_CATEGORIES) {
			if (categoryIds.has(defaultCategory.id)) continue;
			mergedCategories.push(foundry.utils.deepClone(defaultCategory));
			changed = true;
		}
		if (!changed) return;
		return Helpers.setSetting(SETTINGS.MERCHANT_ITEM_CATEGORIES, mergedCategories);
	}

	const customCategories = Array.isArray(categories)
		? categories.filter(category => category?.id && !defaultIds.has(category.id))
		: [];

	return Helpers.setSetting(
		SETTINGS.MERCHANT_ITEM_CATEGORIES,
		[
			...foundry.utils.deepClone(SYMBAROUM_MERCHANT_CATEGORIES),
			...customCategories
		]
	);
}

export async function patchItemGroups() {
	const groups = Helpers.getSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES, []);
	const groupIds = new Set((Array.isArray(groups) ? groups : [])
		.filter(group => typeof group === "object" && group?.id)
		.map(group => group.id));
	const hasOfficialStoreGroups = [
		"marvaloms-expedition",
		"marvaloms-tools",
		"marvaloms-premium",
		"smith-weapons",
		"smith-armor",
		"apothecary-elixirs",
		"blackmoor-relics"
	].some(id => groupIds.has(id));
	const hasSplitGenericGroups = [
		"weapons-melee-short",
		"weapons-melee-one-handed",
		"weapons-melee-long",
		"weapons-melee-heavy",
		"weapons-ranged-thrown",
		"weapons-ranged-projectile",
		"armor-light",
		"armor-medium",
		"armor-heavy",
		"alchemy-elixirs-weak",
		"alchemy-elixirs-moderate",
		"alchemy-elixirs-strong",
		"shields",
		"alchemy-ingredients",
		"artifacts",
		"mystical-treasures",
		"debris",
		"food-drink",
		"trade-goods",
		"transport-buildings"
	].some(id => groupIds.has(id));
	const needsDefaultGroups = !Array.isArray(groups)
		|| !groups.length
		|| groups.every(group => typeof group === "string")
		|| hasOfficialStoreGroups
		|| hasSplitGenericGroups;

	if (!needsDefaultGroups) {
		const defaultsById = new Map(SYMBAROUM_ITEM_GROUPS.map(group => [group.id, group]));
		let changed = false;
		const syncedGroups = groups.map(group => {
			if (typeof group !== "object" || !group?.id || !defaultsById.has(group.id)) return group;
			const defaultGroup = foundry.utils.deepClone(defaultsById.get(group.id));
			const syncedGroup = {
				...group,
				name: defaultGroup.name,
				itemTypes: defaultGroup.itemTypes,
				customCategories: defaultGroup.customCategories,
				sourceModules: defaultGroup.sourceModules,
				worldFolders: defaultGroup.worldFolders,
				search: defaultGroup.search,
				minCost: defaultGroup.minCost,
				maxCost: defaultGroup.maxCost,
				includeNoCost: defaultGroup.includeNoCost
			};
			changed = changed || JSON.stringify(group) !== JSON.stringify(syncedGroup);
			return syncedGroup;
		});
		const syncedGroupIds = new Set(syncedGroups
			.filter(group => typeof group === "object" && group?.id)
			.map(group => group.id));
		for (const defaultGroup of SYMBAROUM_ITEM_GROUPS) {
			if (syncedGroupIds.has(defaultGroup.id)) continue;
			syncedGroups.push(foundry.utils.deepClone(defaultGroup));
			changed = true;
		}
		if (!changed) return;
		return Helpers.setSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES, syncedGroups);
	}

	const obsoleteGroupIds = new Set([
		"marvaloms-expedition",
		"marvaloms-tools",
		"marvaloms-premium",
		"smith-weapons",
		"smith-armor",
		"apothecary-elixirs",
		"blackmoor-relics",
		"weapons-melee-short",
		"weapons-melee-one-handed",
		"weapons-melee-long",
		"weapons-melee-heavy",
		"weapons-ranged-thrown",
		"weapons-ranged-projectile",
		"armor-light",
		"armor-medium",
		"armor-heavy",
		"alchemy-elixirs-weak",
		"alchemy-elixirs-moderate",
		"alchemy-elixirs-strong",
		"shields",
		"alchemy-ingredients",
		"artifacts",
		"mystical-treasures",
		"debris",
		"food-drink",
		"trade-goods",
		"transport-buildings"
	]);
	const currentGroups = Array.isArray(groups) ? groups : [];
	const existingNames = new Set(currentGroups.filter(group => typeof group === "string"));
	const defaultGroups = foundry.utils.deepClone(SYMBAROUM_ITEM_GROUPS);
	for (const name of existingNames) {
		if (defaultGroups.some(group => group.name === name)) continue;
		defaultGroups.push({
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
			includeNoCost: false,
			maxItems: 10,
			minQuantity: 1,
			maxQuantity: 1,
			chance: 100,
			selectedItems: []
		});
	}
	for (const group of currentGroups) {
		if (typeof group !== "object" || !group?.id || obsoleteGroupIds.has(group.id)) continue;
		if (defaultGroups.some(defaultGroup => defaultGroup.id === group.id || defaultGroup.name === group.name)) continue;
		defaultGroups.push(group);
	}

	return Helpers.setSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES, defaultGroups);
}

export async function patchWorldItemCategories() {
	if (game.system.id !== "symbaroum" || !game.user.isGM) return;

	const updates = [];
	for (const item of game.items ?? []) {
		const currentValue = foundry.utils.getProperty(item, CONSTANTS.FLAGS.CUSTOM_CATEGORY)
			?? foundry.utils.getProperty(item, `flags.${CONSTANTS.MODULE_NAME}.item.customCategory`);
		const currentCategories = Array.isArray(currentValue)
			? currentValue.filter(Boolean)
			: currentValue ? [currentValue] : [];
		const defaultCategories = getDefaultSymbaroumItemCategories(item);
		const currentIsOnlyUnique = currentCategories.length === 1
			&& currentCategories[0] === CONSTANTS.UNIQUE_ITEM_CATEGORY;
		const defaultIsUnique = defaultCategories.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY);
		const hasLegacyCategory = currentCategories.some(category => [
			"weapons",
			"armor",
			"alchemy-elixirs",
			"survival-gear",
			"animals"
		].includes(category));
		const shouldUpdate = !currentCategories.length || hasLegacyCategory || (currentIsOnlyUnique && !defaultIsUnique);
		if (!shouldUpdate) continue;

		updates.push(item.update({
			[CONSTANTS.FLAGS.CUSTOM_CATEGORY]: defaultCategories,
			[`${CONSTANTS.FLAGS.ITEM}.notForSale`]: defaultIsUnique,
			[`${CONSTANTS.FLAGS.ITEM}.cantBeSoldToMerchants`]: defaultIsUnique
		}));
	}

	await Promise.all(updates);
	if (updates.length) {
		Helpers.custom_notify(`Item Piles: Symbaroum categorizou ${updates.length} itens do mundo.`);
	}
}

export function applySystemSpecificStyles(data = false) {
	const defaultCssVariables = foundry.utils.deepClone(SETTINGS.DEFAULT_CSS_VARIABLES);
	const cssVariables = data || Helpers.getSetting(SETTINGS.CSS_VARIABLES);
	const mergedCssVariables = foundry.utils.mergeObject(defaultCssVariables, cssVariables)
	const root = document.documentElement;
	for (const [style, val] of Object.entries(mergedCssVariables)) {
		if (!val) {
			root.style.removeProperty(`--item-piles-${style}`)
		} else {
			root.style.setProperty(`--item-piles-${style}`, val);
		}
	}
}

export async function checkSystem() {

	if (!SYSTEMS.HAS_SYSTEM_SUPPORT) {

		if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) return;

		let settingsValid = true;
		for (const [name, data] of Object.entries(SETTINGS.GET_DEFAULT())) {
			if (data.type !== Array && data.type !== String) continue;
			settingsValid = settingsValid && Helpers.getSetting(name).length !== (new data.type).length;
		}

		if (settingsValid) return;

		TJSDialog.prompt({
			title: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Title"),
			content: {
				class: CustomDialog,
				props: {
					content: game.i18n.localize("ITEM-PILES.Dialogs.NoSystemFound.Content")
				}
			},
			modal: true
		}).then(() => {
			SettingsApp.show({ tab: "system" });
		});

		return Helpers.setSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN, true);

	}

	if (Helpers.getSetting(SETTINGS.SYSTEM_FOUND) || SYSTEMS.DATA.INTEGRATION) {
		const currentVersion = Helpers.getSetting(SETTINGS.SYSTEM_VERSION);
		const newVersion = SYSTEMS.DATA.VERSION ?? "";
		Helpers.debug(`Comparing system version - Current: ${currentVersion} - New: ${newVersion}`)
		if (SYSTEMS.DATA.SOFT_MIGRATIONS[currentVersion + "-" + newVersion]) {
			Helpers.debug(`Applying soft migration for ${game.system.title}`);
			await applySoftMigration(currentVersion + "-" + newVersion);
		} else if (foundry.utils.isNewerVersion(newVersion, currentVersion)) {
			Helpers.debug(`Applying system settings for ${game.system.title}`)
			await applyDefaultSettings();
		}
		return;
	}

	await Helpers.setSetting(SETTINGS.SYSTEM_FOUND, true);

	if (Helpers.getSetting(SETTINGS.SYSTEM_NOT_FOUND_WARNING_SHOWN)) {
		Helpers.custom_notify(game.i18n.localize("ITEM-PILES.Notifications.SystemSupportFound"));
	}

	return applyDefaultSettings();
}
