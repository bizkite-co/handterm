import type { VimTutorialStep, IVimCursorPosition } from '../types/VimTutorialTypes';

export const VIM_TUTORIAL_STEPS: VimTutorialStep[] = [
  {
    id: 'vim-01-hjkl',
    title: 'Lesson 1.1: Moving the Cursor (h, j, k, l)',
    instruction: "Use 'h' (left), 'j' (down), 'k' (up), and 'l' (right) to move the cursor to line 3, on top of the word [TARGET].",
    hint: 'Make sure you are in NORMAL mode. Press j twice to move down two lines, then l to move right until on [TARGET].',
    initialText: [
      'Welcome to Vim Tutor in Handterm!',
      'Navigate using standard Vim motions:',
      '--> Move your cursor directly over [TARGET] now.',
      '',
      'Tip: In Vim, the arrow keys work, but hjkl keep your hands on the home row!'
    ].join('\n'),
    initialCursor: { lineNumber: 1, column: 1 },
    targetCursor: (cursor: IVimCursorPosition) => cursor.lineNumber === 3 && cursor.column >= 36 && cursor.column <= 43,
    successMessage: 'Great job! You navigated to the target using hjkl motions.',
  },
  {
    id: 'vim-02-delete-char',
    title: 'Lesson 1.2: Deleting a Character (x)',
    instruction: "In Normal mode, move the cursor over the extra 'c' in 'ccow' and press 'x' to delete it.",
    hint: "Navigate to the second 'c' in 'ccow' and press 'x'. When corrected, it should read 'The cow jumped...'",
    initialText: [
      'Fix the mistake in the line below:',
      'The ccow jumped over the moon.',
      '',
      "Press 'x' while on top of the extra character to delete it."
    ].join('\n'),
    initialCursor: { lineNumber: 2, column: 5 },
    targetText: (text: string) => text.includes('The cow jumped over the moon.') && !text.includes('The ccow jumped'),
    successMessage: "Excellent! 'x' deletes the character under the cursor.",
  },
  {
    id: 'vim-03-delete-word',
    title: 'Lesson 1.3: Deleting a Word (dw)',
    instruction: "Move the cursor to the start of the duplicate word 'words' on line 2, and type 'dw' to delete it.",
    hint: "Place the cursor on the letter 'w' of the second 'words' and type 'd' followed by 'w'.",
    initialText: [
      'Delete the repeated word in this sentence:',
      'There are some words words that do not belong in this sentence.',
      '',
      "'dw' stands for 'delete word' (operator + motion)."
    ].join('\n'),
    initialCursor: { lineNumber: 2, column: 1 },
    targetText: (text: string) => text.includes('some words that do not belong') && !text.includes('words words'),
    successMessage: "Nice! 'dw' deleted the word and its following space.",
  },
  {
    id: 'vim-04-insert-mode',
    title: 'Lesson 1.4: Inserting Text (i ... <Esc>)',
    instruction: "Move cursor to the gap before the period on line 2. Press 'i' to enter INSERT mode, type 'line', and press <Esc> or Alt+S to return to NORMAL mode.",
    hint: "Position cursor before the period, press 'i', type 'line', then press <Esc> (or Alt+S) to finish insertion.",
    initialText: [
      'Insert the missing word:',
      'There is text missing from this .',
      '',
      "Remember: type 'i' to insert, and <Esc> (or Alt+S) to return to NORMAL mode."
    ].join('\n'),
    initialCursor: { lineNumber: 2, column: 32 },
    targetText: (text: string) => text.includes('There is text missing from this line.'),
    targetMode: 'normal',
    successMessage: "Well done! You entered INSERT mode, added text, and returned to NORMAL mode.",
  },
  {
    id: 'vim-05-word-motions',
    title: 'Lesson 1.5: Word Motions (w, b, e)',
    instruction: "Use 'w' to jump forward word by word, and 'e' to land on word ends. Jump until your cursor is on [GOAL].",
    hint: "Press 'w' repeatedly to quickly jump to the start of the next words until you reach [GOAL] on line 2.",
    initialText: [
      'Navigate quickly across words:',
      'Quick brown fox jumps effortlessly towards the [GOAL] today.',
      '',
      "'w' jumps to the start of next word; 'e' jumps to the end of the word; 'b' jumps backward."
    ].join('\n'),
    initialCursor: { lineNumber: 2, column: 1 },
    targetCursor: (cursor: IVimCursorPosition) => cursor.lineNumber === 2 && cursor.column >= 48 && cursor.column <= 53,
    successMessage: "Fast moving! 'w', 'b', and 'e' make traversing text effortless.",
  },
  {
    id: 'vim-06-exiting-vim',
    title: 'Lesson 1.6: Exiting Vim (:q)',
    instruction: "To exit Vim and return to the terminal prompt, type ':q' and press ENTER.",
    hint: "Type the colon ':' followed by 'q' and press ENTER.",
    initialText: [
      'Congratulations on completing the core Vim Tutor lesson!',
      '',
      'Whenever you want to exit the editor without saving changes:',
      'Type  :q  and press <ENTER>',
      '',
      'Try it now to return to the Handterm prompt!'
    ].join('\n'),
    initialCursor: { lineNumber: 4, column: 1 },
    targetMode: 'normal',
    successMessage: "Type :q and press ENTER to return to the terminal.",
  },
];
