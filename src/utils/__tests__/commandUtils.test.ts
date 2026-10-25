import { describe, it, expect } from 'vitest';
import { tokenizeInput, parseCommand } from '../commandUtils';

describe('commandUtils', () => {
  describe('tokenizeInput', () => {
    it('splits words on whitespace', () => {
      expect(tokenizeInput('ta list')).toEqual(['ta', 'list']);
    });

    it('preserves double-quoted strings with spaces', () => {
      expect(tokenizeInput('ta new "Add a brand new feature" -c "Criteria 1"')).toEqual([
        'ta',
        'new',
        'Add a brand new feature',
        '-c',
        'Criteria 1',
      ]);
    });

    it('preserves single-quoted strings with spaces', () => {
      expect(tokenizeInput("ta new 'Single quote task'")).toEqual([
        'ta',
        'new',
        'Single quote task',
      ]);
    });
  });

  describe('parseCommand', () => {
    it('correctly parses command, args, and switches', () => {
      const parsed = parseCommand('ta new "My Task" -c "Check tests" -b "Details"');
      expect(parsed.command).toBe('ta');
      expect(parsed.args).toEqual(['new', 'My Task']);
      expect(parsed.switches).toEqual({
        c: 'Check tests',
        b: 'Details',
      });
    });

    it('correctly handles --long-switches with equals and without equals', () => {
      const parsed1 = parseCommand('ta list --repo=bizkite-co/handterm-tasks');
      expect(parsed1.command).toBe('ta');
      expect(parsed1.args).toEqual(['list']);
      expect(parsed1.switches).toEqual({
        repo: 'bizkite-co/handterm-tasks',
      });

      const parsed2 = parseCommand('ta list --repo bizkite-co/handterm-tasks');
      expect(parsed2.switches).toEqual({
        repo: 'bizkite-co/handterm-tasks',
      });
    });
  });
});
