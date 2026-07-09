import ItemGroupsEditorShell from "./item-groups-editor.svelte";
import Editor from "../Editor.js";

export default class ItemGroupsEditor extends Editor {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("ITEM-PILES.Applications.ItemGroupsEditor.Title"),
			width: 920,
			height: 760,
			id: `item-pile-item-groups-editor-${foundry.utils.randomID()}`,
			svelte: {
				class: ItemGroupsEditorShell
			}
		});
	}
}
