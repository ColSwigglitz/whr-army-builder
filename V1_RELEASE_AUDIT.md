# WHR Army Builder — v1.0 Release Audit

Audit baseline: `main` at/after global 0-1 rollout (`d8968fc9`).
Rules source: **WHR Armies 2026-27 final version**.

## Release decision

**Current status: NOT YET v1.0 READY**

The army catalogue is complete and all 24 selectable configurations are live. Recent work has removed several army-specific defects and introduced a global 0-1/unique-choice system. The remaining highest-risk items are now mostly **global builder-rule gaps**, which is good: fixing them once improves every army.

## Audit categories

Each army/configuration is checked for:

- unit/character/war-machine/special-character availability;
- points and unit-size rules;
- 0-1/unique/flying-regiment restrictions;
- champions and alternate champion types;
- mounts and mounted stat lines;
- war-machine/chariot crew and draught-animal stat lines;
- equipment and upgrade costs;
- magic-item access, limits and uniqueness;
- magic banners;
- army-specific composition systems;
- Roster Pad output;
- runtime loader/extension interactions.

Statuses:

- **PASS** — no current release blocker found in this audit area.
- **PASS WITH PATCHES** — working, but relies on runtime extensions/fixes and should receive regression coverage.
- **RECHECK** — army is live, but an identified global issue can affect it.
- **BLOCKED** — definite defect found that must be fixed before v1.0.

## Global rules audit

| Rule / behaviour | Status | Finding |
|---|---|---|
| At least 50% of army points spent on regiments | PASS | Core status calculation excludes champion points and reports regiment allocation. |
| Minimum 5 infantry/cavalry / 3 monstrous | PASS WITH PATCHES | Core enforces `size.minimum`; global swarm patch enforces swarm minimum 3. |
| Minimum 50 points of models in every regiment | **BLOCKED** | New units start large enough, but the editor only clamps to `size.minimum`. A player can reduce a cheap regiment below 50 points of models and save it. |
| 0-1 units | PASS | Global `global_zero_one.js` now labels and blocks duplicates. |
| All flying regiments unique | PASS | Global 0-1 system recognises flying regiment tags/types/rules. |
| Special characters unique | PASS | Folded into global uniqueness system. |
| Magic items unique army-wide | PASS | Core disables items already used elsewhere, including champions and magic banners. |
| Maximum magic-item count | PASS | Core/army extensions enforce configured maximums. |
| Only one magic weapon per character | PASS | Explicit core guard exists. |
| Only one piece of magic armour per character | **BLOCKED** | There is no equivalent guard for `magic_armour`; multiple magic-armour items can currently be selected if slots permit. |
| Magical mundane-counterpart eligibility | **BLOCKED** | WHR requires the bearer to be eligible for the mundane counterpart (e.g. magic shield requires shield eligibility). Generic item filtering currently filters by pool/category, not mundane eligibility. |
| Wizard-only arcane items/familiars | PASS WITH PATCHES | Enforced by `global_consistency_fixes.js` plus army extensions. |
| Faction magic-item pools | **BLOCKED** | Core `getAllowedMagicItems()` understands only `common` and `empire`. Modern data uses names such as `undead`; if an army extension does not override this, faction-only items can disappear. Tomb Kings is a confirmed at-risk example (`allowedPools:["common","undead"]`). |
| Standard bearer may take magic banner | PASS WITH PATCHES | Generic and global consistency logic supports magic banners; army-specific restrictions are layered where required. |
| Army total must not exceed agreed limit | RECHECK | UI clearly reports points over, but does not prevent saving/printing an illegal over-limit roster. Decide whether v1.0 should hard-block or warn. |
| General must be chosen from highest Leadership; BSB/champions cannot be general | RECHECK | Core data models the rule but there is no obvious roster control for designating/validating the General. |
| Roster Pad mount/crew profiles | PASS WITH PATCHES | Generic support exists; recent fixes cover Wraith steeds and Skeleton Light Chariot crew/steeds. Needs regression tests because several special cases exist. |

## Army-by-army matrix

| Army / configuration | Runtime shape | Current audit status | High-risk areas to regression-test |
|---|---|---|---|
| The Empire | Full JSON + generic/global extensions | RECHECK | Warrior Priest chariot, detachments/auxiliaries, magic counterpart rules, 50-point minimum. |
| High Elves | Compressed payload via bootstrap | RECHECK | Character barding/armour saves, flying regiments, dragon/chariot mounts, faction magic pool. |
| Orcs & Goblins | Full JSON + bootstrap patch + shaman/special-character fixes | PASS WITH PATCHES / RECHECK | All shaman variants/mounts, Spider/Gargantuan Spider uniqueness, chariots, Fanatics, faction magic pool. |
| Dwarfs | Compressed payload + Dwarf extensions | PASS WITH PATCHES / RECHECK | Six 0-1 choices (Longbeards, Hammerers, Ironbreakers, Rangers, Miners, Goblin Hewer), runes, artillery crew, 50-point minimum. |
| Skaven | Full JSON + Skaven extensions | RECHECK | Clanrat mainstay multiplicity rule, BSB 0-1, weapon teams, Screaming Bell, faction magic pool. |
| Vampire Counts | Full JSON + bloodline/champion extensions | PASS WITH PATCHES / RECHECK | Vampire Thrall champions, Wraith steeds, bloodline powers, Von Carstein item access, faction magic pool. |
| Tomb Kings | Full JSON + shared Undead merge | **BLOCKED** | Generic pool mismatch can hide Tomb Kings/Undead faction items. Re-test chariot crew/steeds, Carrion uniqueness, Casket/Catapults. |
| Classic Undead | Full JSON + shared Undead merge | RECHECK | Undead faction magic pool, Bat Swarms, chariots/war machines, mixed character options. |
| Chaos Warriors | Shared compressed Chaos payload + mode extensions | RECHECK | Marks, Abomination 0-1, mounts, Chaos magic items, mode filtering. |
| Beastmen | Shared compressed Chaos payload + mode extensions | RECHECK | Ambush composition, Jabberslythe 0-1, flying units, magic pools. |
| Chaos Daemons | Shared compressed Chaos payload + mode extensions | RECHECK | Daemonic units, flying uniqueness, marks/allegiance filters, roster saves. |
| Chaos Warband | Shared compressed Chaos payload + mode extensions | RECHECK | One-power allegiance, cross-list filters, duplicate/unique units. |
| Chaos Warhost | Shared compressed Chaos payload + mode extensions | RECHECK | 2,000+ requirement, mixed marks/factions, composition filtering. |
| Chaos Dwarfs | Compressed payload + style extensions | PASS WITH PATCHES / RECHECK | Classic/Old School/Modern style filters, Whirlwind/Tenderizer 0-1, greenskin restrictions, artillery crew. |
| Dark Elves | Compressed payload + Dark Elf extensions | RECHECK | Assassins, Cold One/chariot mounts, flying regiments, faction magic pool. |
| Wood Elves | Compressed payload + Classic/Savage extensions | PASS WITH PATCHES / RECHECK | Savage 0-1 Eternal Guard/Rangers/Wild Riders, Stag mounts, Dryad mode behaviour, Zoats, faction magic pool. |
| Grand Army of Bretonnia | Full JSON + Bretonnia extension | PASS WITH PATCHES / RECHECK | Knightly general requirement, virtues, army-only banners, Bertrand profile/options, magic counterpart rules. |
| Lizardmen | Compressed payload + Lizardmen extensions | PASS WITH PATCHES / RECHECK | Jungle Swarms minimum 3, Terradon/flying uniqueness, Stegadon crew/profile output, Slann items. |
| Dogs of War | Compressed payload + multiple DoW extensions | RECHECK | Regiment of Renown uniqueness, Paymaster, Dwarf runes, mercenary magic access, mixed crew/mounts. |
| Halflings of the Moot | Compressed payload + ally/final-fix scripts | RECHECK | Ally selection, Hot-Pot crew, Treemen, faction/common magic access, 50-point minimum. |
| Ogre Mercenaries | Compressed payload + dynamic allied tribe loader | PASS WITH PATCHES / RECHECK | Slow load accepted for now; allied tribe filters, mixed support data, magic access, roster output. |
| Kislev | Compressed payload + Kislev extensions | RECHECK | Bear mounts/riders, artillery crew, flying/unique choices, faction magic pool. |
| Norse | Compressed payload + Norse extensions/guard | RECHECK | Sea vs Land Raider choice, Ambush vs Mammoth exclusivity, multiple champions, magic/rune-like options. |
| Slann Empire | Compressed payload + Slann extensions | RECHECK | Native Tribe selection, Lizardman auxiliaries, Heirlooms, monsters/crew, faction item pools. |

## Definite release blockers discovered in this audit

### V1-B01 — Minimum 50-point regiment rule can be bypassed

WHR says no regiment may include fewer than 50 points worth of models (champions/banners/concealed models excluded). The builder's default size calculation honours this when adding a unit, but the editor subsequently clamps only to `unit.size.minimum`. Cheap units can therefore be edited down to a legal model count that is still below 50 points.

**Required fix:** calculate the effective minimum size as `max(unit.size.minimum, ceil(50/base model cost))` for standard regiment editing, with explicit exceptions only where the source rules require them.

### V1-B02 — Multiple magic armour items can be selected

The core magic-item selector explicitly blocks a second `magic_weapon` but has no equivalent `magic_armour` guard.

**Required fix:** enforce one item whose category is `magic_armour` per bearer, while preserving helmet handling if helmets are represented distinctly in the data.

### V1-B03 — Mundane counterpart requirements are not globally enforced

WHR states a character may only carry a magic item if they could have taken its mundane counterpart. This particularly affects magic shields and armour, and potentially weapon sub-types.

**Required fix:** introduce structured eligibility metadata and a generic eligibility predicate, then have army-specific exceptions extend it rather than bypass it.

### V1-B04 — Generic faction magic-item pool handling is incomplete

Core `getAllowedMagicItems()` only recognises pool names `common` and `empire`. Several newer army books use faction pool identifiers such as `undead`. Army-specific scripts cover some factions, but this is not safe as a global release architecture.

**Confirmed risk:** Tomb Kings character data uses `allowedPools:["common","undead"]` while Tomb Kings faction magic items live in `factionMagicItems`.

**Required fix:** treat the current army's `factionMagicItems` as available whenever `allowedPools` requests its faction pool, or standardise all faction pool identifiers to a common `faction` token.

## Non-blocking release cleanup

1. `README.txt` is obsolete: it still says V10, only Empire is available, and all other armies are skeletons.
2. Front-page copy still says “More armies will be added as their data is completed” even though every catalogue entry is available.
3. Add an explicit displayed application version (`v1.0.0` only after blockers are closed).
4. Add regression checks for the global 0-1 system, swarm sizing, alternative champions, mounts, crew and faction magic pools.
5. Consider whether an over-points roster should be prevented from Save/Roster Pad or remain a prominent warning.
6. Consider a General selector/validator before v1.0.

## Recent fixes already included in the release baseline

- Orc & Goblin missing Shaman variants and Shaman mounts.
- Global swarm minimum-size behaviour (minimum 3).
- Vampire Counts alternate Vampire Thrall/Wraith regimental champions.
- Vampire Counts Wraith ethereal-steed Roster Pad stats.
- Tomb Kings Skeleton Light Chariot crew and Undead Steed Roster Pad stats.
- Dwarf 0-1 entries: Longbeards, Hammerers, Ironbreakers, Rangers, Miners, Goblin Hewer.
- Global 0-1 / Special Character / flying-regiment uniqueness enforcement and display.

## Next execution order

1. Fix V1-B01 (50-point regiment minimum).
2. Fix V1-B04 (generic faction magic pools) and regression-test every army's item lists.
3. Fix V1-B02 + V1-B03 together as one magic-item eligibility pass.
4. Re-run all 24 army configurations through representative roster builds and Roster Pad output.
5. Resolve General/over-points release-policy decisions.
6. Update README/front-page/version and tag v1.0.0 candidate.
