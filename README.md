# Jira Release

**Jira Release** is a CLI tool that helps you compare Jira issues in Git commits against a release plan by pasting Jira release notes directly into the tool.

## Features

- Extracts Jira issue keys directly from release notes.
- Compares issues against Git commit messages.
- Detects missing and extra Jira issues in the selected branch.
- Simple and user-friendly interactive workflow.
- Supports specifying a custom branch for comparison.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/razbakov/jira-release
   cd jira-release
   ```
2. Install dependencies:

   ```bash
   npm install
   ```

3. Install the tool globally:
   ```bash
   npm install -g .
   ```

## Usage

Simply run the `jira-release` command in your terminal, optionally specifying a branch:

```bash
jira-release [branch]
```

### Steps:

1. **Paste Release Notes**:
   The tool will prompt you to paste Jira release notes directly (e.g., `Ctrl+D` to finish input).

2. **Results**:
   - **Found in commits**: Jira issues present in both release notes and commits.
   - **Missing in commits**: Jira issues in the release notes but missing from commits.
   - **Extra in commits**: Jira issues in commits but not in the release notes.

### Example:

```plaintext
Welcome to Jira CLI Tool!

Using branch: "main"

Paste your Jira release notes below (Ctrl+D to finish):
PROJ-123: Implement login feature
PROJ-456: Fix logout issue
PROJ-789: Add user profile updates

Extracted Jira issues: PROJ-123, PROJ-456, PROJ-789

Results:
✅ Found in commits: PROJ-123, PROJ-456
❌ Missing in commits: PROJ-789
🚨 Extra in commits: PROJ-999
```

## Requirements

- **Node.js** v16+ (tested with Node.js v18.19.0)
- A Git repository to analyze commits.

## Development

To run the tool locally without installing it globally:

```bash
npm start
```

## Contributing

Feel free to submit issues or pull requests to improve the tool! 🎉

## License

This project is licensed under the [MIT License](./LICENSE).
