#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * @typedef {{
 *  file: string,
 *  line: number,
 *  code: string,
 *  message: string,
 *  count: number
 * }} TypeErrorEntry
 */

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function getChecklistProgress() {
  const checklistPath = process.env.CHECKLIST_PATH || path.join(
    process.cwd(),
    process.argv[2] || 'docs/worklog/reconcile-mock-types-with-prod/migrate-from-monaco-editor-react/full-rewrite-checklist.md'
  );

  try {
    const content = fs.readFileSync(checklistPath, 'utf8');
    const tasks = content.match(/- \[[x ]\]/g) || [];
    const completed = tasks.filter(t => t.includes('x')).length;

    return {
      currentPhase: content.match(/### Phase \d+: (.+)/)?.[1] || 'Unknown',
      totalTasks: tasks.length,
      completedTasks: completed,
      nextTask: content.match(/- \[ \] (.*?)(?=\n-|$)/s)?.[1]?.trim() || 'Unknown'
    };
  } catch {
    return { error: true };
  }
}

function prioritizeTypeErrors(output) {
  const errorCounts = new Map();

  output.split('\n').forEach(line => {
    const match = line.match(/^(.*?)\((\d+),\d+\): error (TS\d+): (.*)$/);
    if (match) {
      const key = `${match[1]}-${match[3]}`;
      errorCounts.set(key, {
        file: match[1],
        line: parseInt(match[2]),
        code: match[3],
        message: match[4],
        count: (errorCounts.get(key)?.count || 0) + 1
      });
    }
  });

  return Array.from(errorCounts.values())
    .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file))
    .slice(0, 30);
}

function formatStatus(branch, progress, typeErrors) {
  if (progress.error) {
    return `⚠️  Could not load checklist status`;
  }

  let status = `
┌─────────────────── RESTART STATUS ───────────────────┐
│ Branch: ${branch.padEnd(41)}│
│ Current Phase: ${progress.currentPhase.padEnd(34)}│
│ Progress: ${String(progress.completedTasks).padEnd(3)}/${progress.totalTasks} tasks (${Math.round((progress.completedTasks/progress.totalTasks)*100)}%) │
│ Next Task: ${progress.nextTask.substring(0, 40).padEnd(40)}│
├─────────────────── Type Error Priorities ───────────────────┤
${typeErrors.map(e => `│ ${e.file}:${e.line} - ${e.message.substring(0,50)} (${e.code} x${e.count})`.padEnd(79)+'│').join('\n')}
└───────────────────────────────────────────────────────┘
  `.trim();

  // Truncate to terminal height - 10 lines for safety
  const maxLines = process.stdout.rows ? process.stdout.rows - 10 : 20;
  return status.split('\n').slice(0, maxLines).join('\n');
}

const branch = getGitBranch();
const progress = getChecklistProgress();

try {
  const typeErrors = prioritizeTypeErrors(fs.readFileSync(process.argv[3] || '.type-errors.log', 'utf8'));
  console.log(formatStatus(branch, progress, typeErrors));
} catch (error) {
  console.log(formatStatus(branch, progress, []));
  console.error('\n⚠️  Could not load type errors:', error.message);
}