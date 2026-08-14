WHR Army Builder - V10

New in V10
----------
Skeleton JSON files now exist for every army book listed in the WHR 2026-27
Armies Compendium.

Files created
-------------
- The Empire (existing populated file)
- High Elves
- Orcs & Goblins
- Dwarfs
- Skaven
- Undead
- Chaos
- Chaos Dwarfs
- Dark Elves
- Wood Elves
- The Grand Army of Bretonnia
- Lizardmen
- Dogs of War
- Halflings of the Moot
- Ogre Mercenaries
- Kislev
- Norse
- The Slann Empire

Each skeleton follows the same top-level schema as the Empire data:
- meta
- globalArmyRules
- equipment
- profiles
- mounts
- commonMagicItems
- factionMagicItems
- faction
  - armyWideRules
  - systems
  - characters
  - regiments
  - warMachines
  - specialCharacters
  - specialCharacterOnlyItems

data/armies.json now lists every army so the front page is ready for them.
Only The Empire is currently marked available. The other cards are marked
Coming Soon until their JSON has been populated.

To enable a faction later, populate its JSON and change:

    "available": false

to:

    "available": true

in data/armies.json.

Run locally
-----------
From this folder:

    python -m http.server 8000

Then open:

    http://localhost:8000
