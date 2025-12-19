# Deploying to GitHub Pages

Your project is now configured for deployment to GitHub Pages!

## Prerequisites
1. You must have a GitHub account.
2. You must have git installed and configured.

## Steps to Deploy

1.  **Create a New Repository on GitHub:**
    *   Go to [GitHub](https://github.com/new).
    *   Create a new repository (e.g., `smart-pool-dashboard`).
    *   Do **not** initialize with README, .gitignore, or license (you already have them).

2.  **Link Your Local Repository:**
    Open your terminal in this project folder and run:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

3.  **Deploy:**
    Once your code is on GitHub, run this command in your terminal:
    ```bash
    npm run deploy
    ```

4.  **View Your Site:**
    *   After the command finishes, go to your repository on GitHub.
    *   Go to **Settings** > **Pages**.
    *   You should see your live site URL (e.g., `https://your-username.github.io/repo-name/`).

## Making Updates
Whenever you make changes to your code:
1.  Commit your changes: `git add .` and `git commit -m "update"`
2.  Push to GitHub: `git push`
3.  Deploy again: `npm run deploy`
