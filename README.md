# gabriellejsirkin.com

**https://gabriellejsirkin.netlify.app**

Portfolio website for Gabrielle J. Sirkin.

| | URL |
|---|---|
| **Live site** | https://gabriellejsirkin.netlify.app |
| **Preview** | https://draft--gabriellejsirkin.netlify.app |
| **CMS** | https://gabriellejsirkin.netlify.app/admin/ |
| **Local (dev)** | http://localhost:3000 — run `npm start` |

---

## For Gabrielle

### Editing content

Go to the **CMS**: https://gabriellejsirkin.netlify.app/admin/

Log in with GitHub. From there you can:
- Edit projects (text, images, metadata)
- Edit the homepage intro
- Edit site-wide settings (title, description, nav)

### Saving vs. publishing

- **Save** — saves your changes to the **preview site** only. Nothing changes on the live site yet. Use this to stage and review your work.
- **Publish to Live** — pushes everything you've saved to the live site. Click the **Publish to Live** button on the CMS homepage.

Preview URL: https://draft--gabriellejsirkin.netlify.app
Live site: https://gabriellejsirkin.netlify.app

### Uploading images

Use the **Upload Images** tool: https://gabriellejsirkin.netlify.app/admin/upload.html

Drag and drop images or videos (mp4) onto the page. Select the project folder they belong to, then upload. After uploading, open the project in the CMS to add them to the media list.

---

## Pages

| Page | URL |
|------|-----|
| Home / Work | `/` |
| About | `/about.html` |
| Travel Creative Services | `/travel.html` |
| Project (individual) | `/project.html` (loaded dynamically) |

---

## Project folder structure

Every project lives in its own folder inside `content/projects/`:

```
content/projects/
  all-in-the-family/
    index.md        ← all text fields for this project
    hero.jpg
    detail-1.jpg
```

### Project fields (`index.md`)

```
---
title: All in the Family
client: Bon Appétit
cat: Editorial
photographer: Julia Stotz
date: 2024
description: Pasta is the true language of Italy...
credits: Creative Direction & Concept: Gabrielle J Sirkin — Photography: Julia Stotz
skills: Visual Direction, Creative Direction, Production
card_ratio: r-4-3
thumbnail: hero.jpg
coming_soon: false
---
```

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Project name |
| `client` | no | Client or publication |
| `cat` | yes | `Brand Work`, `Editorial`, `Content Creation`, or `Personal` |
| `photographer` | no | Photographer credit |
| `date` | no | Year |
| `description` | no | Paragraph shown above project details |
| `credits` | no | Full credits line |
| `destination` | no | For Content Creation projects only |
| `skills` | yes | Comma-separated list |
| `card_ratio` | no | Card shape: `r-16-9`, `r-4-3`, `r-3-4`, `r-3-2`, `r-2-3`, `r-1-1` |
| `thumbnail` | no | Card image. Defaults to first image in folder if not set. |
| `coming_soon` | no | Set to `true` to show a Coming Soon badge |

Images go in the same folder as `index.md` and are shown automatically in alphabetical order. Use numeric prefixes (`01_`, `02_`) to control the order.

---

## Global settings

Site-wide values live in `content/settings.md` (or edit via the CMS under Settings → Global):

```
---
site_title: Gabrielle J. Sirkin
site_description: Visual Director and photographer based in Los Angeles.
site_url: https://gabriellejsirkin.netlify.app
footer_year: 2026
nav:
  - Work|index.html
  - Travel Creative Services|travel.html
  - About|about.html
---
```

---

## Homepage text

The intro text on the homepage is in `content/pages/home.md` (or edit via the CMS under Pages → Home).

---

## Sharecard (link preview image)

When the site is shared on social media, it shows `sharecard.jpg` from the root folder. Save a **1200 × 630 px** JPG there to update it.

---

## Favicon

`favicon.svg` is a placeholder. Replace with a final version when ready.

---

## Backups

Content is automatically backed up on the **1st of every month**. Backups are stored as zip files in the [Releases](https://github.com/jheftmann/gabriellejsirkin.com/releases) tab on GitHub. Backups older than 6 months are deleted automatically.

To trigger a backup manually: GitHub → Actions → "Monthly content backup" → Run workflow.

---

## For developers

### Local setup

Install [Node.js](https://nodejs.org) (one-time), then:

```
npm install   # first time only
npm start     # starts dev server at localhost:3000
```

`npm start` pulls the latest CMS content from the `draft` branch, builds, and watches for changes.

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Live site — deploys to gabriellejsirkin.netlify.app |
| `draft` | CMS content — deploys to draft--gabriellejsirkin.netlify.app |
| `feature/*` | All dev work — merge into main when ready |

Never commit directly to `main`. Use a feature branch and merge.

### Deploying code changes

```
git checkout -b feature/my-change
# make changes, commit
git push origin feature/my-change
git checkout main && git merge feature/my-change && git push origin main
git branch -d feature/my-change
```

Code changes on `main` automatically sync to `draft` via GitHub Actions.

### Auth

CMS login uses a Cloudflare Worker at `https://sveltia-cms-auth.orsa.workers.dev` (handles GitHub OAuth). See issue #4 for setting up Gabrielle's own worker.

---

## Changelog

### 2026-03-31
- **Fix: publish now syncs project deletions** — the Publish tool compares `content/projects/` on both branches after merging and deletes from `main` any folders removed in the CMS.
- **Fix: draft preview now rebuilds on code syncs** — removed `[skip ci]` from sync-draft commits so Netlify rebuilds the draft preview whenever code is synced from main.
- **Fix: deleted projects removed from production** — 19 projects deleted in the CMS were still showing on the live site; removed from `main`.

### 2026-03-30
- **Project image grid: 3 columns on desktop** — project pages now show 3 columns on laptops/desktop (≥1101px), 2 columns on tablet (601–1100px), 1 column on mobile. Homepage/category grid unchanged (2 col / 1 col).
- **Image captions (#14)** — media items now have an optional Caption field in the CMS. Captioned images/videos render as `<figure><figcaption>` on project pages; no caption = no extra markup.
- **Video thumbnails** — card thumbnails now accept `.mp4` files; they autoplay/loop silently on the project grid.
- **Remove card zoom hover** — thumbnails no longer scale on hover.
- **About & Travel pages editable in CMS (#23)** — all copy (headlines, bio, skills, services, cities, etc.) is now managed through the CMS.
- **Manual project ordering** — two numeric fields (`Order (within category)` and `Order (All page)`) control card sort order. Blank sorts after numbered projects.
- **Director and BTS fields** — added to all project pages (ordered: Client, Photographer, Director, BTS, Year).
- **Multi-line credits** — credits field now supports multi-line text via YAML block scalars.
- **Fix: sync no longer stages content files** — `npm run sync` uses `git restore --worktree` instead of `git checkout`, preventing accidental content commits.
- **Fix: Build Action no longer commits HTML** — removed the HTML commit step from the GitHub Actions build workflow; Netlify handles deploys.
- **Fix: LA Philharmonic always in Brand Work** — corrected `filter: brand` on both `main` and `draft` branches.
- **Fix: Sveltia CMS pinned to 0.146.10** — avoids "Failed to Fetch" regression in newer versions.
