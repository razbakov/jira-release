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

Configure `jira-release` as your Git editor to assist with interactive rebases. It will parse the `git-rebase-todo` file, compare commit messages against Jira release notes, and suggest changes.

```bash
jira-release [branch]
```

### Setup

1. Set `jira-release` as your Git editor:

   Cursor:

   ```bash
   git config --global core.editor "jira-release 'cursor --wait'"
   ```

   VSCode:

   ```bash
   git config --global core.editor "jira-release 'code --wait'"
   ```

   VIM:

   ```bash
   git config --global core.editor "jira-release 'vim'"
   ```

2. Start an interactive rebase:

   ```bash
   git rebase -i <branch>
   ```

3. During the rebase:

   - The tool will prompt you to paste Jira release notes.
   - It will process the `git-rebase-todo` file to:
     - Keep commits matching Jira issues.
     - Comment out commits not in the release notes (suggesting to drop them).
   - The updated file will open in Cursor Editor.

4. Save and close the editor to continue the rebase.

### Example Workflow

1. Start a rebase:

   ```bash
   git rebase -i main
   ```

2. Tool prompt:

   ```plaintext
   Paste your Jira release notes below (Ctrl+D to finish):
   PROJ-123: Implement login feature
   PROJ-456: Fix logout issue
   ```

3. Processed `git-rebase-todo`:

   ```plaintext
   pick abc123 PROJ-123: Implement login feature
   pick def456 PROJ-456: Fix logout issue
   # drop ghi789 PROJ-999: Deprecated feature
   ```

4. Save and continue the rebase:
   ```bash
   git rebase --continue
   ```

## Contributing

Feel free to submit issues or pull requests to improve the tool! 🎉

## License

This project is licensed under the [MIT License](./LICENSE).
