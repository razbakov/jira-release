#!/usr/bin/env node

import readline from "readline";
import { execSync } from "child_process";
import fs from "fs";

(async function main() {
  const rebaseTodoPath = process.argv[2];
  if (!rebaseTodoPath) {
    console.error(
      "Error: This tool is intended to be used during a Git rebase."
    );
    process.exit(1);
  }

  console.log("Welcome to Jira CLI Tool for Git Rebase!");

  // Step 1: Paste release notes
  const releaseNotes = await getUserInput(
    "Paste your Jira release notes below (Ctrl+D to finish):\n"
  );
  const issues = extractJiraKeys(releaseNotes);
  console.log(`\nExtracted Jira issues: ${issues.join(", ")}\n`);

  // Step 2: Read and process git-rebase-todo
  const rebaseTodo = fs.readFileSync(rebaseTodoPath, "utf8");
  const { updatedTodo, stats } = processRebaseTodo(rebaseTodo, issues);

  // Display statistics
  console.log("\nCommit Statistics:");
  console.log(`✅ Keep: ${stats.kept} commits`);
  console.log(`❌ Drop: ${stats.dropped} commits`);

  // Step 3: Write updated rebase-todo back to the file
  fs.writeFileSync(rebaseTodoPath, updatedTodo);

  // Step 4: Try to use VSCode, fall back to git's core.editor if VSCode isn't available
  try {
    execSync(`cursor --wait "${rebaseTodoPath}"`, { stdio: "inherit" });
    console.log("\nUpdated rebase-todo file opened in VSCode.");
  } catch (error) {
    console.log("\nVSCode not available, using git configured editor...");
    const editor =
      execSync("git config core.editor").toString().trim() || "vim";
    execSync(`${editor} "${rebaseTodoPath}"`, { stdio: "inherit" });
  }
})();

function getUserInput(prompt, defaultValue = "") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    })
  );
}

function extractJiraKeys(text) {
  return Array.from(new Set(text.match(/([A-Z]+-\d+)/g) || []));
}

function processRebaseTodo(rebaseTodo, issues) {
  const lines = rebaseTodo.split("\n");
  const stats = { kept: 0, dropped: 0 };

  // Track which issues we find in commits
  const foundIssues = new Set();
  lines.forEach((line) => {
    const match = line.match(/^\s*pick\s+(\w+)\s+(.*)$/);
    if (match) {
      const jiraKey = extractJiraKeys(match[2])[0];
      if (jiraKey && issues.includes(jiraKey)) {
        foundIssues.add(jiraKey);
      }
    }
  });

  // Find missing issues
  const missingIssues = issues.filter((issue) => !foundIssues.has(issue));

  // Add header comments showing expected and missing Jira issues
  const processedLines = [
    `# Expected Jira issues from release notes:`,
    `# ${issues.join(", ")}`,
    `#`,
    missingIssues.length > 0
      ? `# Missing issues:`
      : "# All expected issues found in commits",
    missingIssues.length > 0 ? `# ${missingIssues.join(", ")}` : "#",
    `#`,
    ...lines.map((line) => {
      const match = line.match(/^\s*pick\s+(\w+)\s+(.*)$/);
      if (!match) return line; // Keep non-commit lines as-is

      const [_, commitHash, commitMessage] = match;
      const jiraKey = extractJiraKeys(commitMessage)[0];

      if (jiraKey && issues.includes(jiraKey)) {
        stats.kept++;
        return `pick ${commitHash} ${commitMessage}`;
      } else {
        stats.dropped++;
        if (jiraKey) {
          return `drop ${commitHash} ${commitMessage}`;
        } else {
          return `drop ${commitHash} ${commitMessage}`;
        }
      }
    }),
  ];

  return {
    updatedTodo: processedLines.join("\n"),
    stats,
  };
}
