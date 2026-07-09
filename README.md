# Item Piles: Symbaroum

A Symbaroum-focused version of Item Piles for Foundry VTT.

This module keeps the Item Piles loot, container, merchant, trading, and vault workflows while registering Symbaroum defaults out of the box:

- Item quantity: `system.number`
- Item price: `system.cost`
- Currency attributes: `system.money.thaler`, `system.money.shilling`, and `system.money.orteg`
- Filtered non-loot item types: abilities, boons, burdens, mystical powers, rituals, and traits

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
