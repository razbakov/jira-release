#!/usr/bin/env node

import readline from "readline";
import { execSync } from "child_process";

const mainBranch = process.argv[2] || "main";

(async function main() {
  console.log("Welcome to Jira CLI Tool!");
  console.log(`Using branch: "${mainBranch}"\n`);

  // Step 1: Paste release notes
  const releaseNotes = await getUserInput(
    "Paste your Jira release notes below (Ctrl+D to finish):\n"
  );
  const issues = extractJiraKeys(releaseNotes);
  console.log(`\nExtracted Jira issues: ${issues.join(", ")}\n`);

  // Step 2: Compare issues
  const currentBranch = getCurrentBranch();
  const commitMessages = getGitCommitMessages(currentBranch, mainBranch);
  const commitIssues = extractJiraKeys(commitMessages.join("\n"));

  const missing = issues.filter((issue) => !commitIssues.includes(issue));
  const extra = commitIssues.filter((issue) => !issues.includes(issue));
  const nonJiraCommits = commitMessages.filter(
    (message) => !extractJiraKeys(message).length
  );

  console.log("\n");
  console.log("Results:");
  console.log(
    `✅ Found in commits: ${issues
      .filter((issue) => commitIssues.includes(issue))
      .join(", ")}`
  );
  console.log(`❌ Missing in commits: ${missing.join(", ")}`);
  console.log(`🚨 Extra in commits: ${extra.join(", ")}`);
  if (nonJiraCommits.length) {
    console.log(`🚫 Non-Jira commits: ${nonJiraCommits.length} commits`);
    nonJiraCommits.forEach((message, index) => {
      console.log(`  ${index + 1}. ${message}`);
    });
  }

  // Output commit messages
  console.log("\nCommit Messages:");
  commitMessages.forEach((message, index) => {
    const jiraKey = extractJiraKeys(message)[0];
    let prefix = "✅"; // default for valid commits

    if (!jiraKey) {
      prefix = "🚫"; // non-Jira commit
    } else if (extra.includes(jiraKey)) {
      prefix = "🚨"; // extra commit
    } else if (!issues.includes(jiraKey)) {
      prefix = "❌"; // missing from release notes
    }

    console.log(` ${prefix} ${index + 1}. ${message}`);
  });

  // Step 3: Output git rebase list with pick/drop list of commits
  const commitHashes = execSync(
    `git log ${mainBranch}..${currentBranch} --pretty=format:"%h"` // Changed to use short commit hashes
  )
    .toString()
    .split("\n");
  console.log("\nGit Rebase List:");
  commitMessages.forEach((message, index) => {
    if (
      extra.includes(extractJiraKeys(message)[0]) ||
      nonJiraCommits.includes(message)
    ) {
      console.log(`drop ${commitHashes[index]} ${message}`);
    } else {
      console.log(`pick ${commitHashes[index]} ${message}`);
    }
  });
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

function getCurrentBranch() {
  return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
}

function getGitCommitMessages(branch, compareBranch) {
  return execSync(`git log ${compareBranch}..${branch} --pretty=format:"%s"`)
    .toString()
    .split("\n");
}
