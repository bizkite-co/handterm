# 2024-12-31 Activity Mediator Refactor

## Task
Refactor the activity mediator to simplify switching between Tutorials and GamePhrases by combining them into a single list.

## Problem Understanding
Currently, the system uses two separate arrays (Tutorials and GamePhrases) with a many-to-many tutorialGroup property to manage activity switching. This creates unnecessary complexity.

## Plan
1. Remove Tutorial type and Tutorials array
2. Use GamePhrase type exclusively with displayAs property to distinguish between tutorial and game content
3. Update all references to use the combined list
4. Ensure game phrases have displayAs: "Game" where needed

## Next Steps
1. Remove Tutorial type and Tutorials array from Types.ts
2. Verify all references are updated to use GamePhrase type
3. Ensure proper displayAs values are set
