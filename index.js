#!/usr/bin/env node

import readline from "readline";
import { execSync } from "child_process";
import fs from "fs";

(async function main() {
  const args = process.argv.slice(2);

  // Ensure required parameters (branch and editor) are provided
  if (args.length < 2) {
    console.error("Error: Missing required arguments.");
    console.log("\nUsage: jira-release <editor> <file_to_edit>");
    console.log("\nExamples:");
    console.log(
      `  git config --global core.editor "jira-release 'code --wait'"`
    );
    process.exit(1);
  }

  const editor = args[0]; // Second argument: editor command
  const targetFile = args[1]; // Third argument: file to edit (passed by Git)

  if (!targetFile.includes("git-rebase-todo")) {
    console.log(
      "Standard Git operation detected. Opening the file in the editor..."
    );
    execSync(`${editor} "${targetFile}"`, { stdio: "inherit" });
    return;
  }

  console.log(`Using editor: ${editor}`);
  console.log(`Editing file: ${targetFile}`);

  // Step 1: Paste release notes
  const releaseNotes = await getUserInput(
    "Paste your Jira release notes below (Ctrl+D to finish):\n"
  );
  const issues = extractJiraKeys(releaseNotes);
  console.log(`\nExtracted Jira issues: ${issues.join(", ")}\n`);

  // Step 2: Read and process git-rebase-todo
  const rebaseTodo = fs.readFileSync(targetFile, "utf8");
  const { updatedTodo, stats } = processRebaseTodo(rebaseTodo, issues);

  // Display statistics
  console.log("\nCommit Statistics:");
  console.log(`✅ Keep: ${stats.kept} commits`);
  console.log(`❌ Drop: ${stats.dropped} commits`);

  // Step 3: Write updated rebase-todo back to the file
  fs.writeFileSync(targetFile, updatedTodo);

  // Step 4: Try to use the editor
  try {
    execSync(`${editor} "${targetFile}"`, { stdio: "inherit" });
  } catch (error) {
    console.log("\nEditor not available");
  }
})();

function getUserInput(prompt) {
  console.log(prompt);

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let input = "";

    rl.on("line", (line) => {
      input += line + "\n";
    });

    rl.on("close", () => {
      resolve(input.trim());
    });
  });
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
