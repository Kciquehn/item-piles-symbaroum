# Item Piles: Symbaroum

Item Piles: Symbaroum is a Symbaroum-focused version of Item Piles for Foundry VTT. It keeps the loot, container, merchant, trading, and vault workflows from Item Piles while adding defaults and tools built for Symbaroum tables.

## Features

- Symbaroum system support registered out of the box.
- Portuguese currency labels for Táler/Táleres, Xelim/Xelins, and Ortega/Ortegas.
- Item quantity and price handling for Symbaroum item data.
- Merchant stock generation using configurable commercial item groups.
- Support for official and generic Symbaroum merchant presets.
- Commercial item groups on item sheets so GMs can mark what each item can be sold as.
- Randomized stock quantities and randomized price ranges such as `1-5 Ortegas`.

## Installation

Use this manifest URL in Foundry VTT:

```text
https://github.com/Kciquehn/item-piles-symbaroum/releases/latest/download/module.json
```

## Requirements

- Foundry VTT 13 or 14
- Symbaroum system
- socketlib
- libWrapper

## Development

```bash
npm install
npm run build
```

The build emits `dist/item-piles-symbaroum.js` and `dist/item-piles-symbaroum.css`, matching the module id in `module.json`.

## Credits

Based on Item Piles by Wasp / Fantasy Computerworks.
