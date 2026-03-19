# gabriellejsirkin.com

Portfolio website for Gabrielle J. Sirkin.

| | URL |
|---|---|
| **Production** | https://gabriellesirkin.github.io/gabriellejsirkin.com |
| **CMS** | https://gabriellesirkin.github.io/gabriellejsirkin.com/admin/ |
| **Local preview** | http://localhost:3000 (run `npm start`) |

---

## Pages

| File | URL |
|------|-----|
| `index.html` | Home / Work |
| `about.html` | About |
| `travel.html` | Travel Creative Services |
| `project.html` | Individual project (loaded dynamically) |

---

## CMS

Content is managed via [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin/`.

**CMS URL:** https://gabriellesirkin.github.io/gabriellejsirkin.com/admin/

Login with GitHub. The CMS lets you edit:
- **Projects** — all metadata fields including thumbnail
- **Home** — hero text
- **Settings** — site title, description, nav links

**Auth worker:** `https://sveltia-cms-auth.orsa.workers.dev` (Cloudflare Worker — handles GitHub OAuth)

> Note: Images cannot yet be uploaded via the CMS. Add images by dropping them into the project folder in `content/projects/{slug}/` and pushing to GitHub.

### Draft / publish workflow

The CMS commits to the **`draft`** branch, not `main`. Changes made in the CMS are **not live** until published.

**To publish:**
```
git checkout main
git merge draft
git push
git checkout draft
```

Or open a pull request from `draft` → `main` on GitHub.

---

## Previewing locally

You need [Node.js](https://nodejs.org) installed (download and run the installer — you only need to do this once).

**First time only** — install dependencies:

```
npm install
```

**Every time you want to preview:**

```
npm start
```

This opens the site at **http://localhost:3000** and automatically reloads the browser whenever you save a file in `src/` or `content/`.

**To pull in CMS changes and preview locally:**

```
npm run sync
```

This pulls the latest `draft` branch and rebuilds. The watcher at localhost:3000 will reflect the changes automatically.

---

## Adding or editing a project

Every project lives in its own folder inside `content/projects/`. Each folder contains an `index.md` file that holds all the project's metadata.

```
content/projects/
  all-in-the-family/
    index.md        ← all metadata for this project
    hero.jpg
    detail-1.jpg
```

### The index.md format

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

**Frontmatter fields:**

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Project name |
| `client` | no | Client or publication |
| `cat` | yes | `Brand Work`, `Editorial`, `Content Creation`, or `Personal` |
| `photographer` | no | Photographer credit |
| `date` | no | Year |
| `description` | no | Prose paragraph shown above meta fields |
| `credits` | no | Full credits line shown after the year |
| `destination` | no | For Content Creation projects only |
| `skills` | yes | Comma-separated list |
| `card_ratio` | no | Card aspect ratio (`r-16-9`, `r-4-3`, `r-3-4`, `r-3-2`, `r-2-3`, `r-1-1`) |
| `thumbnail` | no | Card thumbnail image. Defaults to the first project image if not set. |
| `coming_soon` | no | Set to `true` to add a Coming Soon badge |

Images go in the same folder as `index.md` and are displayed automatically in the order they appear on disk.

---

## Deploying

Push your changes to the `main` branch on GitHub. The site updates automatically within a minute or two.

```
git add .
git commit -m "describe what you changed"
git push
```

---

## Editing global settings

Site-wide values live in `content/settings.md` (or edit via the CMS under Settings → Global):

```
---
site_title: Gabrielle J. Sirkin
site_description: Visual Director and photographer based in Los Angeles.
site_url: https://gabriellesirkin.github.io/gabriellejsirkin.com
footer_year: 2026
nav:
  - Work|index.html
  - Travel Creative Services|travel.html
  - About|about.html
---
```

---

## Editing homepage text

The homepage hero text is in `content/pages/home.md` (or edit via the CMS under Pages → Home).

---

## Sharecard (link preview image)

When the site is shared on social media it uses `sharecard.jpg` in the root folder. Save a **1200 × 630 px** JPG there to enable it.

---

## Favicon

The favicon (`favicon.svg`) is a temporary placeholder. Replace it with a proper version when ready.
