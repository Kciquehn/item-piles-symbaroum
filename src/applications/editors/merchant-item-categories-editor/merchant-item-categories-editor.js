import MerchantItemCategoriesEditorShell from "./merchant-item-categories-editor.svelte";
import Editor from "../Editor.js";

export default class MerchantItemCategoriesEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: `item-pile-merchant-item-categories-editor-${foundry.utils.randomID()}`,
			title: game.i18n.localize("ITEM-PILES.Applications.MerchantItemCategoriesEditor.Title"),
			width: 920,
			height: 760,
			svelte: {
				class: MerchantItemCategoriesEditorShell,
			}
		})
	}
}
