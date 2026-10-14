# TaskForge — Personal Job Task Manager

A responsive, browser-based task manager for organizing engineering and everyday work. Built with plain HTML, CSS, and JavaScript; no server, framework, API key, or build step is required.

## Features

- Create, edit, delete, and complete tasks
- Categories for Electrical Design, BOM & Documentation, PLC / HMI / VFD, Testing & Troubleshooting, Meetings & Follow-ups, Personal, and Other
- High, Medium, and Low priority
- Due dates with overdue and due-today indicators
- All, Today, Upcoming, Overdue, Completed, and category filters
- Search, priority filtering, and sorting
- Summary cards and completion progress
- Responsive layout for desktop, tablet, and mobile
- Export and import a JSON backup
- Stores tasks in browser `localStorage`

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

No installation or build command is needed.

## Deploy to GitHub Pages

1. Create a GitHub repository named `my-task-manager` (public is simplest for GitHub Pages).
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then click **Save**.
6. Wait for the Pages deployment to finish. Your site URL will look like:
   `https://YOUR-GITHUB-USERNAME.github.io/my-task-manager/`

If the repository is named `YOUR-GITHUB-USERNAME.github.io`, the URL will instead be `https://YOUR-GITHUB-USERNAME.github.io/`.

## Important storage and privacy notes

- Tasks are stored only in the current browser profile on the current device. They are not synced to another computer or browser.
- Clearing this site's browser data, using private/incognito mode, or changing browsers can remove or hide saved tasks. Use **Export backup (JSON)** regularly and store the backup safely.
- GitHub Pages hosts the application files; it does not sync your task records to GitHub.
- Do not enter confidential company, customer, or personal information into a shared/public device.
- The repository contains the app source, not your task data. Do not commit task backup JSON files to a public repository.
