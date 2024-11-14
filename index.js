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

  console.log("\n");
  console.log("Results:");
  console.log(
    `✅ Found in commits: ${issues
      .filter((issue) => commitIssues.includes(issue))
      .join(", ")}`
  );
  console.log(`❌ Missing in commits: ${missing.join(", ")}`);
  console.log(`🚨 Extra in commits: ${extra.join(", ")}`);
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
