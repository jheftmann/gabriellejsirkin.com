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

### Categories

The category filter bar on the homepage ("All / Visual Direction / Content Creation / …") is fully driven by the CMS.

**To add, remove, rename, or reorder the filter tabs:** CMS → **Settings** → **Categories** list. The order you set there is the order they appear in on the homepage.

**To put a project in a category:** open the project → **Categories** field → click the **+** button to add a row → type the category name. Repeat for each additional category. Each name must match a category in Settings exactly (case-insensitive, but no typos).

**A project can be in more than one category.** Add one row per category — the project will appear in each of those filter tabs (and in "All"). If you see the categories rendered as a single comma-separated line (e.g. `Visual Direction, Content Creation`), that also works as a fallback — the build splits on commas — but the per-row UI is the intended way.

If a project's Categories field is empty, it won't appear in any tab — including "All".

**Setting position on each tab:** each Categories row has a **Position** number — that's the position on that tab. To control position on the **All** tab, you can either (a) fill in the **Order on the All tab** field below, or (b) add a Categories row named **All** with the desired Position — the row's position takes precedence if both are set.

### Credits

The credits section on each project page is built from the **Credits** field (a list of label/value pairs). Examples: `Photographer / Julia Sellmann`, `Stylist / Jane Smith`, `Producer / John Doe`.

**To edit:** open a project → scroll to **Credits** → click **Add Credit** to add a row, or edit/remove existing rows. The label can be anything you want.

The old fixed fields (Photographer, Director, BTS) were merged into this list. All existing values were carried over — you can edit or remove them just like any other credit row.

> **Tip — order long credits last**
> The credit columns each size to their own content (capped at ~196px). When one column's value wraps to multiple lines and ends on a short last line, the whitespace between *that* line and the next column can look bigger than the spacing between full-width lines and the next column — it's a natural side-effect of left-aligned ragged-right text. To minimise this, put any long-list credit (e.g. "Sabrina Bajaj, Chelsea Gold, Gabrielle Sirkin and Audrey Viola") as the **last** credit row so the wrap happens at the right edge of the layout where there's nothing next to it.

### Links and formatting in text fields

The About bio, the Services intro/approach, the Services / Clients / City Guides lists, and the skill descriptions all accept **markdown** — so you can add links and basic emphasis without writing HTML.

| You type | What renders |
|----------|--------------|
| `[A Golden Hour Project](https://www.agoldenhourproject.com)` | a clickable link |
| `[Email me](mailto:gabriellejsirkin@gmail.com)` | a mail link |
| `*italic*` | *italic* |
| `**bold**` | **bold** |

Raw HTML (e.g. `<a href="…">…</a>`) also still works if you prefer.

The project page **Description** (the long body text on a project) also accepts full markdown — paragraphs, lists, headings, links, the lot. The short frontmatter Description summary stays plain text by design.

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
| `cat` | no | YAML list of category names; must match entries in `settings.categories` (slugified for filter matching). A project can be in multiple categories. |
| `date` | no | Year |
| `description` | no | Paragraph shown above project details |
| `credits_list` | no | List of `{ label, value }` objects rendered as the project credits section |
| `credits` | no | Free-form trailing credits text (rendered after `credits_list`) |
| `skills` | no | List of tags shown on card and project page |
| `card_ratio` | no | Card shape: `r-16-9`, `r-4-3`, `r-3-4`, `r-3-2`, `r-2-3`, `r-1-1` |
| `thumbnail` | no | Card image or video. Defaults to first media item. |
| `order` | no | Position within category tab (blank = after numbered projects) |
| `order_all` | no | Position on All tab (blank = after numbered projects) |
| `coming_soon` | no | Shows Coming Soon badge on card |

The filter bar order is derived from `settings.categories` in `content/settings.md`. Each project's `cat` array is slugified into `filters` and emitted on the card as `data-category="slug1 slug2"`; the homepage JS does `dataset.category.split(' ').includes(f)` to determine matches.

### Page titles, meta tags, and OG images

Each page gets a `<title>`, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`), and matching Twitter Card tags. These are generated by `computePageMeta()` in `build.js` at build time.

#### CMS-editable fields (per page)

Open any page in the CMS (Home, About, Travel) and scroll to the **SEO / Social** section:

| CMS field | What it controls |
|-----------|-----------------|
| **OG Title** | The `og:title` and `twitter:title` values. Leave blank to fall back to the page default. |
| **OG Description** | The `og:description` and `twitter:description` values. |
| **OG Image** | The image shown when the page is shared on social. Upload a **1200 × 630 px** JPG/PNG. |

#### Global settings

In the CMS under **Settings**:

| Field | What it controls |
|-------|-----------------|
| **Site URL** (`site_url`) | Used as the base for `og:url` and `og:image` absolute URLs. Should be `https://gabriellejsirkin.com` (or the Netlify URL until the custom domain is set). |

#### `<title>` format per page

| Page | Format |
|------|--------|
| Home | `Gabrielle J. Sirkin — Creative Studio for Travel` |
| About | `About — Gabrielle J. Sirkin` |
| Travel | `Travel Creative Services — Gabrielle J. Sirkin` |
| Project | `Client / Title — Gabrielle J. Sirkin, Creative Studio for Travel` (if no client: just `Title — …`) |

The title is always the `<title>` tag. `og:title` uses the CMS **OG Title** field when set, otherwise falls back to the same value.

#### Default OG image fallback

If no **OG Image** is set for a page, `og:image` falls back to `{site_url}/sharecard.jpg`. This means the root `sharecard.jpg` acts as the global social preview image. Replace it with a **1200 × 630 px** JPG to update the fallback.

#### How it works in code

`computePageMeta(page, pageContent, settings, firstProjectSrc)` in `build.js`:
1. Reads `og_title`, `og_description`, `og_image` from the page's markdown frontmatter.
2. Falls back to per-page defaults for title, description, and `sharecard.jpg` for the image.
3. Resolves relative image paths against `settings.site_url`.
4. Returns a block of `<meta>` tags injected into `<!-- #meta -->` in each template's `<head>`.

### Color themes

Each project page, and the About and Services pages, can have an individually assigned color theme. The theme controls background, text, and nav link colors.

**To set a theme on a project:** open the project in the CMS → find the **Color Theme** field → choose from the dropdown → save and publish.

**To change the About or Services page theme:** go to the CMS → Pages → About (or Services) → **Color Theme** field.

**Available themes:**

| Name | Background | Notes |
|------|-----------|-------|
| Default | Cream `#f2ede6` | Used for Home and all unthemed pages |
| Colorway 1 | Dusty rose `#c9919e` | |
| Colorway 2 | Pale yellow `#f4dba1` | |
| Colorway 3 | Soft teal `#c0d6d4` | |
| Colorway 4 | Mint `#dcffcd` | |
| Colorway 5 | Dark red `#551507` | Light nav (white) |
| Colorway 6 | Warm tan `#aa7347` | |
| Colorway 7 | Coral red `#ff5045` | Light nav (white) |
| About | Dark olive `#232b09` | Light nav (white) |
| Services | Dark teal `#1d4648` | Light nav (white) |

Themes with **light nav** automatically switch the navigation links to white to stay legible on dark backgrounds.

The Home and Category pages are always Default — the theme picker on the Home page in the CMS is there if you ever want to experiment, but Default is the intended theme.

### Google Analytics

To enable Google Analytics, add your **GA4 Measurement ID** to the CMS:

1. Go to the CMS → **Settings**
2. Find the **Google Analytics Tracking ID** field
3. Enter your Measurement ID — it looks like `G-XXXXXXXXXX`
4. Save and publish

The GA4 snippet is injected into every page at build time. Leave the field blank to disable analytics entirely — no tracking code will be included in the output.

To find your Measurement ID: Google Analytics → Admin → Data Streams → your stream → Measurement ID.

### Sharecard

When shared on social media, shows `sharecard.jpg` from the root folder. Replace with a **1200 × 630 px** JPG to update.

### Favicon

`favicon.svg` is a placeholder. Replace with a final version when ready.

---

## Changelog

### 2026-05-14 / 15
- **Per-category project order (#86)** — `cat` field schema in admin/config.yml is now a list of `{name, position}` objects. Each project carries one `data-order-<slug>="N"` attribute per category it's in (plus `data-order-all`); index.js sorts by the attribute matching the active filter. All 33 projects auto-migrated by `scripts/migrate-cat-with-positions.js`. Top-level `order` field removed.
- **Cannot add category (#84)** — same schema change: list widget now uses `fields:` (plural, object items) instead of `field:` (singular). Sveltia's "+ Add" button works reliably with this shape.
- **Publish to live error (#85)** — root cause was `assets/css/travel.css` deleted from `main` in #83 but never propagated to `draft` (sync action only copied files). Cleaned up the orphan and improved `.github/workflows/sync-draft.yml` to mirror deletions going forward; also expanded managed paths to whole `assets/` and added `favicon-32x32.png`.
- **Skills as a dynamic list** — replaced the 8 fixed `skill1_name`…`skill4_desc` fields with a single `skills_list` list widget. Gabrielle can add any number of skills via the CMS now.
- **Card hover** — removed `filter: blur(2px)`; opacity 0.8 only. (#80)
- **Dropdown arrow** — replaced inline SVG on `.filter-select` with the typeface's down-arrowhead glyph (U+2304) via `::after`, so it aligns with the select text in the same font. (#81)
- **Markdown / links in text fields** — `marked.parseInline()` now runs on `bio`, `approach`, services/clients/cities list items, skill name + skill desc. `[text](url)` markdown links + raw HTML both work. Documented in README.
- **Color theme update** — colorway-7 values changed to match Figma. (#75)
- **Project page favicon** — coral circle on light-blue (Figma node 224:4154). PNG regenerated from SVG via sharp.
- **About page color theme** — `#232b09` → `#232809`, `--text` to `#aac0c1` (#50, Figma node 223:3281).
- **Typography fine-tuning (#50)** — many small fixes, see commit history. Notably font weights remapped: GT Standard Light → 300, Regular → 400 (was 400/500 range — was producing faux-bold).
- **Leading-compensation pattern (`--gap-*` tokens)** — `site.css` has one `@supports (text-box-trim: trim-both)` block toggling four semantic gap tokens. Spots that need a gap only when leading is trimmed (project header lines, card-caption, project-desc paragraphs, travel-grid list items) read the token directly. Single source of truth.
- **Heading / paragraph color swap on about page** — h2/h3 now use `--text` (foreground), body paragraphs use `--muted` (mid), per Figma node 223:3281.
- **GitHub Pages disabled** — the repo had Pages turned on (source: main root) which was generating failure-build emails on every push since the site is actually deployed via Netlify. Pages turned off.

### 2026-05-13
- **Flexible categories (#54, #66, #67)** — the filter bar is driven by `settings.categories` in the CMS; projects can belong to multiple categories. `cat` is now a YAML list field (was a single string select).
- **Flexible credits (#54, #72)** — `photographer`/`director`/`bts`/`destination` fixed fields replaced by a `credits_list` of `{ label, value }` pairs. Existing data migrated via `scripts/migrate-credits-fixup.js`.
- **Auto footer year (#65)** — `build.js` derives the footer year from `new Date()`; field removed from the CMS.
- **Project image grid (#61)** — 2-column desktop with a 4-cycle width stagger (100/85/85/100%) and 2.625rem vertical offset on even items; 1-column mobile with 92%-wide alternating left/right.
- **Layout & type pass (#55, #57, #59, #62, #63, #64, #69, #70)** — wider side margins (4.5rem→6rem); removed ALL-CAPS from labels/filter bar/card category; project description bumped to 24px/400/upright; `.credit-item` capped at 196px; project title line-gap tightened to Figma spec; colorway-5 `--text`/`--muted` swapped; nav 16px on mobile.
- **Sticky footer + consistent page title position** — flex column body keeps the footer pinned to the viewport bottom; hero/project/about/services share the same top padding so the title lands at the same vertical position on every page.

### 2026-05-11
- **Dominant color loading state (#37)** — card thumbnails fade in from their dominant color rather than a blank placeholder. `build.js` pre-extracts dominant colors via `sharp` at build time.
- **Card hover states (#38)** — semi-transparent overlay on card thumbnails, subtitle hidden by default and revealed on hover, nav brand dims on hover, filter buttons show `cursor:pointer`.
- **Page titles, OG tags, and CMS-editable metadata (#42)** — each page now has a proper `<title>`, `og:title/description/image`, and Twitter Card tags. OG fields are editable per-page in the CMS.
- **Semantic HTML and accessibility (#40, #41)** — `<main id="main-content">`, skip-to-content link, `aria-current` on active nav, `<dl>/<dt>/<dd>` for project credits, `<ul>` for grid lists, `<th scope="col">` on tables, sidebar social links extracted to a shared partial (`_sidebar-links.html`), shared display font rule DRY'd across `site.css`.

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
