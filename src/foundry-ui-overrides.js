import * as Helpers from "./helpers/helpers.js";
import * as PileUtilities from "./helpers/pile-utilities.js";
import { isValidItemPile } from "./helpers/pile-utilities.js";
import ItemPileConfig from "./applications/item-pile-config/item-pile-config.js";
import ItemEditor from "./applications/item-editor/item-editor.js";
import SETTINGS from "./constants/settings.js";
import CONSTANTS from "./constants/constants.js";
import UserSelectDialog from "./applications/dialogs/user-select-dialog/user-select-dialog.js";
import { getSymbaroumItemCategories } from "./helpers/symbaroum-item-categories.js";

export let fastToolTip = null;

export default function registerUIOverrides() {
	Hooks.on("renderPlayers", addTradeButton);
	Hooks.on("getActorContextOptions", insertActorContextMenuItems);
	Hooks.on("getActorSheetHeaderButtons", insertActorHeaderButtons);
	Hooks.on("getItemSheetHeaderButtons", insertItemHeaderButtons);
	Hooks.on("getHeaderControlsApplicationV2", insertHeaderButtons);
	Hooks.on("renderItemDirectory", hideTemporaryItems);
	Hooks.on("renderItemSheet", renderSymbaroumItemGroupSelector);
	Hooks.on("renderTokenHUD", renderPileHUD);
	Hooks.on("hoverToken", handleTokenBorders);
	Hooks.on("controlToken", handleTokenBorders);
	fastToolTip = new FastTooltipManager();
	fastToolTip.activateEventListeners();
}

function renderSymbaroumItemGroupSelector(itemSheet, html) {
	if (!game.user.isGM || game.system.id !== "symbaroum") return;

	const item = itemSheet?.object ?? itemSheet?.item ?? itemSheet?.document;
	if (!(item instanceof Item)) return;

	const root = html instanceof HTMLElement ? html : html?.[0] ?? itemSheet.element?.[0] ?? itemSheet.element;
	if (!root || root.querySelector(".item-piles-symbaroum-item-group")) return;

	const itemGroups = Helpers.getSetting(SETTINGS.CUSTOM_ITEM_CATEGORIES, [])
		.map(group => typeof group === "string" ? { id: group, name: group } : group)
		.filter(group => group?.id && group?.name)
		.sort((a, b) => a.name.localeCompare(b.name));

	const currentCategories = new Set(getSymbaroumItemCategories(item));
	const wrapper = document.createElement("div");
	wrapper.className = "attribute item-piles-symbaroum-item-group";

	const label = document.createElement("label");
	label.textContent = "Grupos comerciais";
	label.htmlFor = `${item.id}-item-piles-symbaroum-item-group`;
	wrapper.append(label);
	wrapper.append(createSymbaroumItemGroupPicker(item, itemGroups, currentCategories));

	const select = document.createElement("select");
	select.id = `${item.id}-item-piles-symbaroum-item-group`;
	select.style.display = "none";
	select.multiple = true;
	select.size = 4;
	select.innerHTML = `
		<option value="${CONSTANTS.UNIQUE_ITEM_CATEGORY}">Único/Não Comerciável</option>
	`;
	wrapper.append(select);

	for (const group of itemGroups) {
		const option = document.createElement("option");
		option.value = group.id;
		option.textContent = group.name;
		select.append(option);
	}
	for (const option of select.options) {
		option.selected = currentCategories.has(option.value);
	}
	select.addEventListener("change", async event => {
		let value = Array.from(event.currentTarget.selectedOptions).map(option => option.value);
		const isUnique = value.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY);
		if (isUnique) {
			value = [CONSTANTS.UNIQUE_ITEM_CATEGORY];
			for (const option of event.currentTarget.options) {
				option.selected = option.value === CONSTANTS.UNIQUE_ITEM_CATEGORY;
			}
		}
		await item.update({
			[CONSTANTS.FLAGS.CUSTOM_CATEGORY]: value,
			[`${CONSTANTS.FLAGS.ITEM}.notForSale`]: isUnique,
			[`${CONSTANTS.FLAGS.ITEM}.cantBeSoldToMerchants`]: isUnique
		});
	});

	const bonusTab = root.querySelector('.tab[data-tab="bonus"], [data-group="primary"][data-tab="bonus"]');
	const target = bonusTab?.querySelector(".bonus.foreground.border, .bonus") ?? root.querySelector(".bonus.foreground.border, .bonus") ?? root.querySelector("form") ?? root;
	target.append(wrapper);
}

function createSymbaroumItemGroupPicker(item, itemGroups, currentCategories) {
	const details = document.createElement("details");
	details.style.width = "100%";
	details.style.minWidth = "0";
	details.style.textAlign = "left";

	const summary = document.createElement("summary");
	summary.style.cursor = "pointer";
	summary.style.padding = "2px 6px";
	summary.style.minHeight = "22px";
	summary.style.background = "rgba(255, 255, 255, 0.7)";
	summary.style.color = "#111";
	summary.textContent = getSelectedCategorySummary(itemGroups, currentCategories);
	details.append(summary);

	const list = document.createElement("div");
	list.style.maxHeight = "180px";
	list.style.overflowY = "auto";
	list.style.padding = "4px 6px";
	list.style.background = "rgba(255, 255, 255, 0.92)";
	list.style.color = "#111";
	list.style.border = "1px solid rgba(0, 0, 0, 0.35)";
	list.style.display = "grid";
	list.style.gap = "2px";
	details.append(list);

	const options = [
		{ id: CONSTANTS.UNIQUE_ITEM_CATEGORY, name: "Único/Não Comerciável" },
		...itemGroups
	];
	for (const group of options) {
		const row = document.createElement("label");
		row.style.display = "grid";
		row.style.gridTemplateColumns = "18px minmax(0, 1fr)";
		row.style.gap = "6px";
		row.style.alignItems = "center";
		row.style.margin = "0";
		row.style.padding = "3px 4px";
		row.style.lineHeight = "1.2";
		row.style.color = "#111";
		row.style.background = "#fff";
		row.style.borderBottom = "1px solid rgba(0, 0, 0, 0.12)";

		const input = document.createElement("input");
		input.type = "checkbox";
		input.value = group.id;
		input.checked = currentCategories.has(group.id);
		input.style.margin = "0";
		input.style.width = "14px";
		input.style.height = "14px";
		row.append(input);

		const text = document.createElement("span");
		text.textContent = group.name;
		text.style.overflow = "hidden";
		text.style.textOverflow = "ellipsis";
		row.append(text);
		list.append(row);
	}

	list.addEventListener("change", async event => {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		if (target.value === CONSTANTS.UNIQUE_ITEM_CATEGORY && target.checked) {
			for (const input of list.querySelectorAll("input")) {
				input.checked = input === target;
			}
		} else if (target.checked) {
			const uniqueInput = list.querySelector(`input[value="${CONSTANTS.UNIQUE_ITEM_CATEGORY}"]`);
			if (uniqueInput) uniqueInput.checked = false;
		}
		let value = Array.from(list.querySelectorAll("input:checked")).map(input => input.value);
		if (!value.length) {
			value = [CONSTANTS.UNIQUE_ITEM_CATEGORY];
			const uniqueInput = list.querySelector(`input[value="${CONSTANTS.UNIQUE_ITEM_CATEGORY}"]`);
			if (uniqueInput) uniqueInput.checked = true;
		}
		const isUnique = value.includes(CONSTANTS.UNIQUE_ITEM_CATEGORY);
		summary.textContent = getSelectedCategorySummary(itemGroups, new Set(value));
		await item.update({
			[CONSTANTS.FLAGS.CUSTOM_CATEGORY]: value,
			[`${CONSTANTS.FLAGS.ITEM}.notForSale`]: isUnique,
			[`${CONSTANTS.FLAGS.ITEM}.cantBeSoldToMerchants`]: isUnique
		});
	});

	return details;
}

function getSelectedCategorySummary(itemGroups, categories) {
	if (categories.has(CONSTANTS.UNIQUE_ITEM_CATEGORY)) return "Único/Não Comerciável";
	const names = itemGroups
		.filter(group => categories.has(group.id))
		.map(group => group.name);
	if (!names.length) return "Nenhum grupo selecionado";
	if (names.length <= 2) return names.join(", ");
	return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function handleTokenBorders(token) {
	if (!isValidItemPile(token)) return;
	const setting = Helpers.getSetting(SETTINGS.HIDE_TOKEN_BORDER);
	token.border.renderable = token.controlled ||
		(setting !== SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.EVERYONE && (
			setting === SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.SHOW
			||
			(setting === SETTINGS.HIDE_TOKEN_BORDER_OPTIONS.PLAYERS && game.user.isGM)
		));
}

function hideTemporaryItems(sidebar, html) {
	const root = html instanceof HTMLElement ? html : html?.[0] ?? sidebar.element;
	const $root = $(root);
	Array.from(game.items).filter(item => {
			return foundry.utils.getProperty(item.toObject(), CONSTANTS.FLAGS.TEMPORARY_ITEM);
		})
		.forEach(item => {
			const element = $root.find(`.directory-item[data-document-id="${item.id}"]`);
			if (!element.length) return;
			if (element.parent().children().length === 1) {
				return element.parent().empty();
			}
			element.remove();
		});
}

function createTradeButton() {
	const minimalUI = game.modules.get('minimal-ui')?.active;
	const classes = "item-piles-player-list-trade-button item-piles-v13" + (minimalUI ? " item-piles-minimal-ui" : "");
	const text = !minimalUI ? game.i18n.localize("ITEM-PILES.ContextMenu.RequestTrade") : "";
	const button = $(`<button type="button" class="${classes}"><i class="fas fa-handshake"></i>${text}</button>`)
	button.click(() => {
		game.itempiles.API.requestTrade();
	});
	return button;
}

function addTradeButton(app, html) {
	if (!Helpers.getSetting(SETTINGS.ENABLE_TRADING) || !Helpers.getSetting(SETTINGS.SHOW_TRADE_BUTTON)) return;
	$(html).find("#players-active .players-list").append(createTradeButton());
}

function insertActorContextMenuItems(html, menuItems) {

	menuItems.push({
		name: "Item Piles: " + game.i18n.localize("ITEM-PILES.ContextMenu.ShowToPlayers"),
		icon: `<i class="fas fa-eye"></i>`,
		callback: async (html) => {
			const actualHtml = $(html)[0];
			const actorId = actualHtml.dataset.documentId || actualHtml.dataset.entryId;
			const actor = game.actors.get(actorId);
			const activeUsers = Array.from(game.users).filter(u => u.active && u !== game.user).map(u => u.id);
			if (!activeUsers.length) {
				return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Warnings.NoPlayersActive"), true);
			}
			const users = await UserSelectDialog.show();
			if (!users || !users.length) return;
			Helpers.custom_notify(game.i18n.format("ITEM-PILES.Notifications.ShownToPlayers", { actor_name: actor.name }))
			return game.itempiles.API.renderItemPileInterface(actor, { userIds: users, useDefaultCharacter: true });
		},
		condition: (html) => {
			const actualHtml = $(html)[0];
			const actorId = actualHtml.dataset.documentId || actualHtml.dataset.entryId;
			const actor = game.actors.get(actorId);
			return game.user.isGM && PileUtilities.isValidItemPile(actor);
		}
	}, {
		name: "Item Piles: " + game.i18n.localize("ITEM-PILES.ContextMenu.RequestTrade"),
		icon: `<i class="fas fa-handshake"></i>`,
		callback: (html) => {
			const actualHtml = $(html)[0];
			const actorId = actualHtml.dataset.documentId || actualHtml.dataset.entryId;
			const actor = game.actors.get(actorId);
			const user = Array.from(game.users).find(u => u.character === actor && u.active);
			return game.itempiles.API.requestTrade(user);
		},
		condition: (html) => {
			const actualHtml = $(html)[0];
			const actorId = actualHtml.dataset.documentId || actualHtml.dataset.entryId;
			const actor = game.actors.get(actorId);
			return Helpers.getSetting(SETTINGS.ENABLE_TRADING)
				&& (game.user?.character !== actor || Array.from(game.users).find(u => u.character === actor && u.active));
		}
	});
}

function insertHeaderButtons(app, buttons) {
	if (app.document instanceof foundry.documents.BaseActor) {
		return insertActorHeaderButtons(app, buttons);
	}

	if (app.document instanceof foundry.documents.BaseItem) {
		return insertItemHeaderButtons(app, buttons);
	}
}

function insertActorHeaderButtons(actorSheet, buttons) {

	if (!game.user.isGM || Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_BUTTON)) return;

	let obj = actorSheet?.object ?? actorSheet?.actor;

	const method = () => {
		ItemPileConfig.show(obj);
	};

	buttons.unshift({
		label: Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT)
			? ""
			: game.i18n.localize("ITEM-PILES.HeaderButtons.Configure"),
		icon: "fas fa-box-open",
		class: "item-piles-config-button",
		onClick: method,
		onclick: method
	})
}

function insertItemHeaderButtons(itemSheet, buttons) {

	if (!game.user.isGM || Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_BUTTON)) return;

	let obj = itemSheet?.object ?? itemSheet?.item;

	const method = async (event) => {
		if (game.modules.get("item-linking")?.active && !event.ctrlKey) {
			const linkedItemUuid = foundry.utils.getProperty(obj, "flags.item-linking.baseItem") ?? false;
			if (linkedItemUuid) {
				obj = await foundry.utils.fromUuid(linkedItemUuid);
				return ItemEditor.show(obj, {
					extraTitle: " - Compendium"
				});
			}
		}
		return ItemEditor.show(obj);
	};

	buttons.unshift({
		label: !Helpers.getSetting(SETTINGS.HIDE_ACTOR_HEADER_TEXT) ? game.i18n.localize("ITEM-PILES.HeaderButtons.Configure") : "",
		icon: "fas fa-box-open",
		class: "item-piles-config-button",
		onclick: method,
		onClick: method,
	})
}

function renderPileHUD(app, html) {

	const document = app?.object?.document;

	if (!document) return;

	if (!PileUtilities.isValidItemPile(document)) return;

	if (!PileUtilities.isItemPileContainer(document)) return;

	const pileData = PileUtilities.getActorFlagData(document);

	const htmlType = "button";
	const offset = "85";

	const container = $(`<div class="col right" style="right:-${offset}px;"></div>`);

	const lock_button = $(`<${htmlType} class="control-icon item-piles" data-action="toggleControls" data-fast-tooltip="${game.i18n.localize("ITEM-PILES.HUD.ToggleLocked")}"><i inert class="fa-solid fa-lock${pileData.locked ? "" : "-open"}"></i></${htmlType}>`);
	lock_button.click(async function () {
		$(this).find('.fas').toggleClass('fa-lock').toggleClass('fa-lock-open');
		await game.itempiles.API.toggleItemPileLocked(document);
	});
	container.append(lock_button);

	const open_button = $(`<${htmlType} class="control-icon item-piles" data-action="toggleControls" data-fast-tooltip="${game.i18n.localize("ITEM-PILES.HUD.ToggleClosed")}"><i inert class="fa-solid fa-box${pileData.closed ? "" : "-open"}"></i></${htmlType}>`);
	open_button.click(async function () {
		$(this).find('.fas').toggleClass('fa-box').toggleClass('fa-box-open');
		await game.itempiles.API.toggleItemPileClosed(document);
	});
	container.append(open_button);

	const configure_button = $(`<${htmlType} class="control-icon item-piles" data-action="close" data-fast-tooltip="${game.i18n.localize("ITEM-PILES.HUD.Configure")}"><i inert class="fa-solid fa-toolbox"></i></${htmlType}>`);
	configure_button.click(async function () {
		ItemPileConfig.show(document);
	});
	container.append(configure_button);

	$(html).append(container);

}

class FastTooltipManager extends (foundry?.helpers?.interaction?.TooltipManager?.implementation ?? TooltipManager) {

	/**
	 * An amount of margin which is used to offset tooltips from their anchored element.
	 * @type {number}
	 */
	static TOOLTIP_MARGIN_PX = 5;
	/**
	 * The number of milliseconds delay which activates a tooltip on a "long hover".
	 * @type {number}
	 */
	static TOOLTIP_ACTIVATION_MS = 500;
	/**
	 * The number of milliseconds delay which activates a tooltip on a "long hover".
	 * @type {number}
	 */
	static TOOLTIP_DEACTIVATION_MS = 500;
	/**
	 * The directions in which a tooltip can extend, relative to its tool-tipped element.
	 * @enum {string}
	 */
	static TOOLTIP_DIRECTIONS = {
		UP: "UP",
		DOWN: "DOWN",
		LEFT: "LEFT",
		RIGHT: "RIGHT",
		CENTER: "CENTER"
	};
	/**
	 * A reference to the HTML element which is currently tool-tipped, if any.
	 * @type {HTMLElement|null}
	 */
	element = null;
	/**
	 * Is the tooltip currently active?
	 * @type {boolean}
	 */
	#active = false;
	/**
	 * A reference to a window timeout function when an element is activated.
	 * @private
	 */
	#activationTimeout;
	/**
	 * A reference to a window timeout function when an element is deactivated.
	 * @private
	 */
	#deactivationTimeout;
	/**
	 * An element which is pending tooltip activation if hover is sustained
	 * @type {HTMLElement|null}
	 */
	#pending;

	constructor() {
		super();
		const tooltipElem = $(`<aside id="fast-tooltip" role="tooltip"></aside>`);
		$("body").append(tooltipElem);
		this.tooltip = document.getElementById("fast-tooltip");
	}

	/* -------------------------------------------- */

	/**
	 * Activate interactivity by listening for hover events on HTML elements which have a data-fast-tooltip defined.
	 */
	activateEventListeners() {
		document.body.addEventListener("pointerenter", this.#onActivate.bind(this), true);
		document.body.addEventListener("pointerleave", this.#onDeactivate.bind(this), true);
	}

	/* -------------------------------------------- */

	/**
	 * Handle hover events which activate a tooltipped element.
	 * @param {PointerEvent} event    The initiating pointerenter event
	 */
	#onActivate(event) {
		if (Tour.tourInProgress) return; // Don't activate tooltips during a tour
		const element = event.target;
		if (!element.dataset.fastTooltip) {
			// Check if the element has moved out from underneath the cursor and pointerenter has fired on a non-child of the
			// tooltipped element.
			if (this.#active && this.element && !this.element.contains(element)) this.#startDeactivation();
			return;
		}

		// Don't activate tooltips if the element contains an active context menu
		if (element.matches("#context-menu") || element.querySelector("#context-menu")) return;

		// If the tooltip is currently active, we can move it to a new element immediately
		if (this.#active) this.activate(element);
		else this.#clearDeactivation();

		// Otherwise, delay activation to determine user intent
		this.#pending = element;
		this.#activationTimeout = window.setTimeout(() => {
			this.activate(element);
		}, Number(element?.dataset?.tooltipActivationSpeed) || this.constructor.TOOLTIP_ACTIVATION_MS);
	}

	activate(element, { text, direction, cssClass } = {}) {

		// Check if the element still exists in the DOM.
		if (!document.body.contains(element)) return;
		this.#clearDeactivation();

		// Mark the element as active
		this.#active = true;
		this.element = element;
		element.setAttribute("aria-describedby", "fast-tooltip");
		this.tooltip.innerHTML = text || game.i18n.localize(element.dataset.fastTooltip);

		// Activate display of the tooltip
		this.tooltip.removeAttribute("class");
		this.tooltip.classList.add("active");
		if (cssClass) this.tooltip.classList.add(cssClass);

		// Set tooltip position
		direction = direction || element.closest("[data-tooltip-direction]")?.dataset.tooltipDirection;
		if (!direction) direction = this._determineDirection();
		this._setAnchor(direction);
	}

	/* -------------------------------------------- */

	/**
	 * Handle hover events which deactivate a tooltipped element.
	 * @param {PointerEvent} event    The initiating pointerleave event
	 */
	#onDeactivate(event) {
		if (event.target !== (this.element ?? this.#pending)) return;
		this.#startDeactivation();
	}

	/* -------------------------------------------- */

	/**
	 * Start the deactivation process.
	 */
	#startDeactivation() {
		// Clear any existing activation workflow
		window.clearTimeout(this.#activationTimeout);
		this.#pending = this.#activationTimeout = null;

		// Delay deactivation to confirm whether some new element is now pending
		window.clearTimeout(this.#deactivationTimeout);
		this.#deactivationTimeout = window.setTimeout(() => {
			if (!this.#pending) this.deactivate();
		}, Number(this.element?.dataset?.tooltipDeactivationSpeed) || this.constructor.TOOLTIP_DEACTIVATION_MS);
	}

	/* -------------------------------------------- */

	/**
	 * Clear any existing deactivation workflow.
	 */
	#clearDeactivation() {
		window.clearTimeout(this.#deactivationTimeout);
		this.#pending = this.#deactivationTimeout = null;
	}
}
