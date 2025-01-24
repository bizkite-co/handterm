#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function getChecklistProgress() {
  const checklistPath = path.join(
    process.cwd(),
    'docs/worklog/reconcile-mock-types-with-prod/migrate-from-monaco-editor-react/full-rewrite-checklist.md'
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

function formatStatus(branch, progress) {
  if (progress.error) {
    return `⚠️  Could not load checklist status`;
  }

  return `
┌─────────────────── RESTART STATUS ───────────────────┐
│ Branch: ${branch.padEnd(41)}│
│ Current Phase: ${progress.currentPhase.padEnd(34)}│
│ Progress: ${String(progress.completedTasks).padEnd(3)}/${progress.totalTasks} tasks completed (${Math.round((progress.completedTasks/progress.totalTasks)*100)}%) │
│ Next Recommended Task: ${progress.nextTask.substring(0, 40).padEnd(40)}│
└───────────────────────────────────────────────────────┘
  `.trim();
}

const branch = getGitBranch();
const progress = getChecklistProgress();
console.log(formatStatus(branch, progress));