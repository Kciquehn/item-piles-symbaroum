import fs from "node:fs";
import path from "node:path";

const files = [
	"node_modules/@typhonjs-fvtt/runtime/_dist/svelte/component/application/ApplicationShell.svelte",
	"node_modules/@typhonjs-fvtt/runtime/_dist/svelte/component/application/TJSApplicationShell.svelte",
	"node_modules/@typhonjs-fvtt/runtime/_dist/svelte/component/application/EmptyApplicationShell.svelte"
];

const oldSnippet = `   function onKeydown(event)
   {
      // TODO: Note this handling is specifically for Foundry v11+ as the platform KeyboardManager uses
      // \`document.querySelector(':focus')\` to short circuit keyboard handling internally to KeyboardManager.
      // ApplicationShell manages containing focus programmatically and this prevents the Foundry KeyboardManager from
      // activating. We need to check if this key event target is currently the \`elementRoot\` or \`elementContent\` and
      // the event matches any KeyboardManager actions and if so blur current focus.
      if ((event.target === elementRoot || event.target === elementContent) &&
       KeyboardManager && KeyboardManager?._getMatchingActions?.(
        KeyboardManager?.getKeyboardEventContext?.(event))?.length)`;

const newSnippet = `   function onKeydown(event)
   {
      const keyboardManager = globalThis.foundry?.helpers?.interaction?.KeyboardManager ?? globalThis.KeyboardManager;

      // TODO: Note this handling is specifically for Foundry v11+ as the platform KeyboardManager uses
      // \`document.querySelector(':focus')\` to short circuit keyboard handling internally to KeyboardManager.
      // ApplicationShell manages containing focus programmatically and this prevents the Foundry KeyboardManager from
      // activating. We need to check if this key event target is currently the \`elementRoot\` or \`elementContent\` and
      // the event matches any KeyboardManager actions and if so blur current focus.
      if ((event.target === elementRoot || event.target === elementContent) &&
       keyboardManager && keyboardManager?._getMatchingActions?.(
        keyboardManager?.getKeyboardEventContext?.(event))?.length)`;

for (const file of files) {
	const absolutePath = path.resolve(file);
	if (!fs.existsSync(absolutePath)) continue;

	const source = fs.readFileSync(absolutePath, "utf8");
	if (source.includes("const keyboardManager = globalThis.foundry?.helpers?.interaction?.KeyboardManager")) continue;
	if (!source.includes(oldSnippet)) {
		console.warn(`TyphonJS KeyboardManager patch skipped: ${file}`);
		continue;
	}
	fs.writeFileSync(absolutePath, source.replace(oldSnippet, newSnippet));
}
