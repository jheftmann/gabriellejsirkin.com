# gabriellejsirkin.com

**https://gabriellejsirkin.netlify.app**

Portfolio website for Gabrielle J. Sirkin.

---

## For Gabrielle — Content Editing

### Your tools

| Tool | URL |
|------|-----|
| **CMS** (edit content) | https://gabriellejsirkin.netlify.app/admin/ |
| **Upload Images** | https://gabriellejsirkin.netlify.app/admin/upload.html |
| **Publish to Live** | https://gabriellejsirkin.netlify.app/admin/publish.html |
| **Preview site** | https://draft--gabriellejsirkin.netlify.app |
| **Live site** | https://gabriellejsirkin.netlify.app |

---

### Editing workflow

#### Step 1 — Upload images or videos
Go to the **Upload Images** tool. Drag and drop your files, select the project folder, and upload. Accepts JPG, PNG, and MP4.

#### Step 2 — Edit in the CMS
Go to the **CMS**. Log in with GitHub. From here you can:
- Add or edit projects (text, images, metadata)
- Edit the About and Travel pages
- Edit homepage copy
- Edit site-wide settings

Make your changes and click **Save**. This saves to the **preview site only** — nothing changes on the live site yet.

#### Step 3 — Review on preview
Check your changes at the **preview site**: https://draft--gabriellejsirkin.netlify.app

The preview updates within about 30 seconds of saving.

#### Step 4 — Publish to live
When you're happy with the preview, go to the **Publish to Live** tool and click **Publish to Live Site**. The live site updates within about 30 seconds.

---

### Important notes

> **Order fields — leave blank or enter a number, don't clear after setting**
> The "Order (within category)" and "Order (All page)" fields control where a project appears in its tab. If you set a number and then delete it, save the project again with the field left blank — don't leave it half-edited. If a project ever appears blank in the CMS, open it, clear both Order fields, and save again.

> **Uploading images vs. adding to Media list**
> Uploading a file adds it to the project folder but doesn't put it on the page. After uploading, open the project in the CMS and add the filename to the **Media** list to control where it appears.

> **Thumbnail — image or video**
> The Card Thumbnail field accepts both images and MP4 videos. Leave it blank to use the first item in the Media list automatically.

> **Coming Soon**
> Toggle "Coming Soon" on a project to show a badge on the card without publishing the full project.

> **Backups**
> Content is automatically backed up on the 1st of every month. Backups are stored as zip files in the [Releases](https://github.com/jheftmann/gabriellejsirkin.com/releases) tab on GitHub. To trigger a backup manually: GitHub → Actions → "Monthly content backup" → Run workflow.

---

## For Developers

### URLs

| | URL |
|---|---|
| **Live site** | https://gabriellejsirkin.netlify.app |
| **Preview** | https://draft--gabriellejsirkin.netlify.app |
| **CMS** | https://gabriellejsirkin.netlify.app/admin/ |
| **GitHub repo** | https://github.com/jheftmann/gabriellejsirkin.com |
| **Local (dev)** | http://localhost:3000 — run `npm start` |

### Local setup

Install [Node.js](https://nodejs.org) (one-time), then:

```
npm install   # first time only
npm start     # starts dev server at localhost:3000
```

`npm start` pulls the latest CMS content from the `draft` branch, builds, and watches for changes.

### Tech stack

- **Builder:** `build.js` — custom Node.js static site generator (no framework)
- **Templates:** `src/*.html` → compiled to root `*.html` (never edit root files directly)
- **Content:** `content/projects/*/index.md` + `content/pages/*.md` + `content/settings.md`
- **CMS:** Sveltia CMS (git-based), config in `admin/config.yml`, pinned to 0.146.10
- **Hosting:** Netlify — `main` → production, `draft` → preview
- **Auth:** Cloudflare Worker at `https://sveltia-cms-auth.orsa.workers.dev` (see issue #4)

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production — deploys to gabriellejsirkin.netlify.app |
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

### Pages

| Page | URL |
|------|-----|
| Home / Work | `/` |
| About | `/about.html` |
| Travel Creative Services | `/travel.html` |
| Project (individual) | `/project.html` (loaded dynamically) |

### Project frontmatter fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | yes | Project name |
| `client` | no | Client or publication |
| `cat` | yes | `Brand Work`, `Editorial`, `Content Creation`, or `Personal` |
| `photographer` | no | Photographer credit |
| `director` | no | Director credit |
| `bts` | no | BTS credit |
| `date` | no | Year |
| `description` | no | Paragraph shown above project details |
| `credits` | no | Full credits (supports multi-line) |
| `destination` | no | For Content Creation projects only |
| `skills` | no | List of tags shown on card and project page |
| `card_ratio` | no | Card shape: `r-16-9`, `r-4-3`, `r-3-4`, `r-3-2`, `r-2-3`, `r-1-1` |
| `thumbnail` | no | Card image or video. Defaults to first media item. |
| `order` | no | Position within category tab (blank = after numbered projects) |
| `order_all` | no | Position on All tab (blank = after numbered projects) |
| `coming_soon` | no | Shows Coming Soon badge on card |

### Sharecard

When shared on social media, shows `sharecard.jpg` from the root folder. Replace with a **1200 × 630 px** JPG to update.

### Favicon

`favicon.svg` is a placeholder. Replace with a final version when ready.

---

## Changelog

### 2026-04-01
- **Fix: CMS projects showing blank (#31)** — `order_all: null` written by Sveltia caused it to crash when re-opening those projects. Removed from all 29 affected project files.
- **Fix: mp4 thumbnails now uploadable in CMS (#32)** — thumbnail field changed from `image` to `file` widget.
- **Fix: order field hint no longer implies 1–99 cap (#33)** — no upper limit was ever enforced in code.

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
