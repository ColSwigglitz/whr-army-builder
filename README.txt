WHR Army Builder - Version 2.0.0
================================

WHR Army Builder is a browser-based army list builder and campaign manager for Warhammer Renaissance.

Version 2.0.0 expands the original army builder with optional user accounts, cloud-saved armies, shared army visibility and Phoenix Games campaign management while retaining the full v1 army-building and printable roster functionality.

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
- Optional user accounts with cloud-saved armies.
- Private and shared army visibility.
- Public display names without exposing user email addresses.
- Phoenix Games campaign creation and membership management.
- Campaign-associated armies with campaign-specific construction restrictions.
- Territory ownership, random generation, campaign-owner assignment and manual creation.
- Territory transfers, fixed territory values, Lost Valley child territories and ownership caps.
- Campaign deletion with owner confirmation and cascading cleanup of campaign data.
- Privacy notice, account-data controls and account-retention foundation.
- Printable Roster Pad with model, champion, mount and crew stat lines.
- Automated release, site-integrity, browser-smoke and campaign-security regression checks.

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
The front-end application is static and can be served from any ordinary web server. Account and campaign functionality uses Supabase.

From the repository folder, start a simple local web server, for example:

    python -m http.server 8000

Then open:

    http://localhost:8000

Opening index.html directly from the filesystem is not recommended because browser security restrictions can prevent army data from loading correctly.

Data and structure
------------------
Army data is stored under data/ with additional loader and extension scripts used for army-specific rules and runtime normalisation. data/armies.json defines the armies/configurations presented on the front page.

Supabase migrations are stored under supabase/. Campaign and account writes are protected using Row Level Security and security-definer RPC functions where required.

Automated tests under tests/ cover release regression, general-system rules, site integrity, campaign security and browser smoke testing.

Unofficial project notice
-------------------------
This web site and project are completely unofficial and in no way endorsed by Games Workshop Limited.

Games Workshop, Warhammer, Warhammer: The Old World, Citadel, Forge World, GW and associated names, logos, marks, races, characters, vehicles, locations, units, illustrations and images from the Warhammer world are trademarks and/or copyright of Games Workshop Ltd and their respective owners. Used without permission. No challenge to their status intended.
