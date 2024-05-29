---
original file name: Codeium Chat - Dmp3NXpcjJan0RQM7hzDrgAiNfxdQfON.md
summary: The user is looking to aggregate averages for each character in an array of objects in TypeScript. They want to calculate the average word per minute (WPM) for each character based on multiple entries of the same character. The chat provides a TypeScript function that groups the objects by character, calculates the average WPM for each group, and returns a new array with the aggregated averages. The code snippet includes the necessary logic to achieve this and suggests potential modifications for handling other fields like durationMilliseconds.
date: 2024-05-28T15:49
---

# Codeium Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

**User** _at 3:49 pm, May 28, 2024_

I have an array of these:

```ts
export type CharWPM = {
  character: string;
  wpm: number;
  durationMilliseconds: number;
}
```

I want to aggregate a list of averages for each character. So if I have two `c` characters, one with 10 `wpm` and one with 20 `wpm`, I want the final array to have one `c` character with a 15 `wpm`. 

How can I do that in TypeScript?

---

**Codeium** _at 3:49 pm, May 28, 2024_

You can achieve this by iterating over your array of `CharWPM` objects, grouping them by the `character` field, and calculating the average WPM for each group. Here's a succinct TypeScript function that does this:

```typescript
export type CharWPM = {
    character: string;
    wpm: number;
    durationMilliseconds: number;
};

function averageWpmByCharacter(charWpms: CharWPM[]): CharWPM[] {
    const charGroups: Record<string, { totalWpm: number, count: number }> = {};

    // Sum WPMs for each character and count occurrences
    charWpms.forEach(({ character, wpm }) => {
        if (!charGroups[character]) {
            charGroups[character] = { totalWpm: 0, count: 0 };
        }
        charGroups[character].totalWpm += wpm;
        charGroups[character].count++;
    });

    // Calculate average WPM for each character
    return Object.entries(charGroups).map(([character, { totalWpm, count }]) => ({
        character,
        wpm: totalWpm / count,
        durationMilliseconds: 0, // You may want to handle duration aggregation differently
    }));
}

// Example usage:
const charWpms: CharWPM[] = [
    { character: 'c', wpm: 10, durationMilliseconds: 100 },
    { character: 'c', wpm: 20, durationMilliseconds: 200 },
    // ... other CharWPM objects ...
];

const averagedWpms = averageWpmByCharacter(charWpms);
console.log(averagedWpms);
```

This function will return a new array with unique characters and their corresponding average WPM. Note that I've set `durationMilliseconds` to `0` for the resulting array since the appropriate aggregation for `durationMilliseconds` wasn't specified. You may want to modify this part to suit your needs.