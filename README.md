# UNIMAID Department of Business Administration — Academic Portal

Central Academic Resource Platform for the Department of Business Administration, University of Maiduguri.

- **Cloud Backend**: Connected directly to the official Google Drive repository (`https://drive.google.com/drive/folders/1KtDYFMSZ5ZjGxt-Z-9-mRxKAgLrYenMy`)
- **Student Uploads**: Supports up to 100MB documents with instant publishing to the live Resource Bank.
- **Offline Intelligence**: Full offline AI assistant for management theories, project chapters 1–5, and core courses.
- **Academic Toolkit**: 5.0 CGPA calculator, Pomodoro focus timer, and research topic generator.

---

## Deploying to GitHub Pages (3 Simple Ways)

### Method 1: Automatic GitHub Actions (Recommended)
This repository includes `.github/workflows/deploy.yml`.
1. In your GitHub repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Push your code to the `main` or `master` branch.
4. GitHub Actions will automatically build and launch the site live!

---

### Method 2: Deploy from `/docs` folder (Instant zero-setup)
The compiled production bundle is pre-built in the `/docs` folder with relative paths and `.nojekyll`.
1. In your GitHub repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
3. Set **Branch** to `main` (or `master`) and folder to `/docs`.
4. Click **Save**. Your site will be live within 60 seconds!

---

### Method 3: Standalone Single File (Zero build)
If you prefer a single-file drop-in without Node.js, `docs/bua-fixed-standalone.html` or `public/bua-fixed-standalone.html` can be renamed to `index.html` in any branch or folder.

---

## Local Development

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```
