WHR Army Builder - Version 1.0.0
================================

WHR Army Builder is a browser-based army list builder for Warhammer Renaissance.

Version 1.0.0 is the first full release. The supported army books are populated and available from the front-page army selector, with army composition validation, configurable units and characters, magic items, mounts, champions, saved rosters and printable Roster Pad output.

Release features
----------------
- Full front-page army book selection.
- All supported Warhammer Renaissance army books populated and available.
- Army points totals and composition validation.
- Global 0-1 and unique-choice enforcement, including flying regiments.
- Regiment minimum-size and minimum-points enforcement.
- Character equipment, mounts and magic-item selection.
- Faction-specific magic-item pools and eligibility rules.
- Unit champions and alternative champion profiles where applicable.
- Support for cavalry mounts, chariot steeds, war-machine crews and other secondary profiles.
- Swarm minimum-size handling.
- Local roster save/load support.
- Printable Roster Pad with model, champion, mount and crew stat lines.
- Automated v1 release regression checks covering all selectable army configurations.

Supported armies
----------------
- The Empire
- High Elves
- Orcs & Goblins
- Dwarfs
- Skaven
- Undead / Vampire Counts
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

Some army books provide multiple selectable configurations or variants; these are presented by the application where appropriate.

Running locally
---------------
The application is a static web application and does not require a build step.

From the repository folder, start a simple local web server, for example:

    python -m http.server 8000

Then open:

    http://localhost:8000

Opening index.html directly from the filesystem is not recommended because browser security restrictions can prevent army data from loading correctly.

Data and structure
------------------
Army data is stored under data/ with additional loader and extension scripts used for army-specific rules and runtime normalisation. data/armies.json defines the armies/configurations presented on the front page.

The v1 regression workflow checks the supported army configurations and key global rules whenever relevant release code changes.

Unofficial project notice
-------------------------
This web site and project are completely unofficial and in no way endorsed by Games Workshop Limited.

Warhammer: the Old World, Citadel, Forge World, Games Workshop, GW, Warhammer and associated names, logos, marks, races, characters, vehicles, locations, units, illustrations and images from the Warhammer world are trademarks and/or copyright of Games Workshop Ltd and their respective owners. Used without permission. No challenge to their status intended.
