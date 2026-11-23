# gabriellejsirkin.com

**https://gabriellejsirkin.com**

Portfolio website for Gabrielle J. Sirkin.

---

## For Gabrielle — Content Editing

### Your tools

| Tool | URL |
|------|-----|
| **Studio** (edit content) | https://gabrielle-sirkin.sanity.studio |
| **Live site** | https://gabriellejsirkin.com |

**Full guide:** [docs/studio-guide.md](docs/studio-guide.md)

---

### Editing workflow

#### Step 1 — Open Studio
Go to **https://gabrielle-sirkin.sanity.studio**. All content is managed here.

#### Step 2 — Make your changes
- **Add or edit a project** → Projects in the sidebar
- **Edit page content** → Pages → Home / About / Services
- **Edit site-wide settings** → Site Settings

Changes **auto-save as a draft** while you type — you'll see a yellow "Edited" indicator at the top of the document. A draft is only visible to you in Studio; it does **not** appear on the live site until you publish.

#### Step 3 — Publish
When you're ready for changes to go live, click the **Publish** button (green, top right of the document). The yellow "Edited" badge disappears, and the live site updates within about 30 seconds.

> **Draft vs. Published — the key rule:** anything you do in Studio is a draft until you click Publish. The live site only ever shows published content. If a change isn't showing up on the live site, check whether you've published it.

---

### Reordering projects

**Homepage / "All" order** — open **Homepage** in the Studio sidebar → drag projects into order. Changes are **live immediately** — no Publish needed.

**Per-category order** — open **Landing Pages** in the sidebar → open the category → drag projects into order → **Publish the Landing Page document**.

The two orderings are independent.

---

### Uploading images

Upload images and videos directly in Studio:
- Inside a project → click any image or media field → Upload
- Or use the **Media** tab in the sidebar to manage all assets in one place

Supported formats: JPG, PNG, WebP, GIF, MP4. Upload originals — the site generates optimized sizes automatically.

---

### Links and formatting in text fields

The Description, bio, and caption fields accept basic **markdown**:

| You type | What renders |
|----------|--------------|
| `[Link text](https://example.com)` | a clickable link |
| `*italic*` | *italic* |
| `**bold**` | **bold** |

---

## For Developers

### URLs

| | URL |
|---|---|
| **Live site** | https://gabriellejsirkin.com |
| **Studio** | https://gabrielle-sirkin.sanity.studio |
| **GitHub repo** | https://github.com/jheftmann/gabriellejsirkin.com |
| **Local (dev)** | http://localhost:3000 — run `npm start` |
| **Sanity project** | `t4atn37a` / dataset: `production` |

### Local setup

Install [Node.js](https://nodejs.org) (one-time), then:

```
cp .env.example .env   # fill in SANITY_API_TOKEN
npm install
npm start              # starts dev server at localhost:3000
```

Content is fetched from Sanity at build time. No local content files to sync.

### Tech stack

- **Builder:** `build.js` — custom Node.js static site generator (no framework)
- **Templates:** `src/*.html` → compiled to root `*.html` (never edit root files directly)
- **Content:** Sanity v3 CMS — fetched at build time via `scripts/sanity-build.js`
- **Hosting:** Netlify — `main` → production (`publishedOnly`); branch deploys → preview (`previewDrafts`)
- **Studio:** `studio/` — Sanity Studio v3, deployed at `gabrielle-sirkin.sanity.studio`

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to gabriellejsirkin.com |
| `feature/*` | All dev work — merge into main via PR |

Never commit directly to `main`. Use a feature branch and PR.

### Deploying code changes

```
git checkout -b feature/my-change
# make changes, commit, push
gh pr create   # open PR → merge to main → Netlify auto-deploys
git branch -d feature/my-change
```

### Deploying Studio changes

```
cd studio
npx sanity deploy
```

Studio changes (schema, structure, plugins) must be deployed separately — merging to main doesn't update the Studio.

### Pages

| Page | URL |
|------|-----|
| Home / Work | `/` |
| About | `/about.html` |
| Travel Creative Services | `/travel.html` |
| Project (individual) | `/project.html` (loaded dynamically) |

### Content model

All content is managed in Sanity. Key document types:

| Type | Purpose |
|------|---------|
| `project` | Portfolio projects — orderable via `orderRank` |
| `landingPage` | Per-category project order (one doc per category) |
| `homePage` | Homepage hero + SEO |
| `aboutPage` | About page content |
| `servicesPage` | Services/travel page content |
| `siteSettings` | Nav, contact info, categories, global SEO |

**Project ordering:**
- Homepage / "All" filter — drag in Studio **Homepage** sidebar item (`projectOrder` singleton, `liveEdit: true` — instant, no Publish)
- Per-category — drag refs inside each `landingPage` document, then Publish

**Build:**
`scripts/sanity-build.js` fetches all content via GROQ, builds `catOrders` and `orderAll` maps, and emits `data-order-<slug>` / `data-order-all` attributes on each card for client-side sorting.

### Page titles, meta tags, and OG images

Each page gets a `<title>`, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`), and matching Twitter Card tags. These are generated by `computePageMeta()` in `build.js` at build time.

#### Studio-editable fields (per page)

Open any page or project in Studio and go to the **SEO** tab:

| Field | What it controls |
|-------|-----------------|
| **Title override** | The `og:title` and `twitter:title`. Leave blank to fall back to the page default. |
| **Description** | The `og:description` and `twitter:description`. |
| **Share image** | Shown when shared on social. Use a **1200 × 630 px** image. Defaults to the project thumbnail. |

#### Global settings

In Studio under **Site Settings**:

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

**To set a theme on a project:** open the project in Studio → **Media** tab → **Color Theme** → pick a swatch → Publish.

**To change the About or Services page theme:** Studio → Pages → About (or Services) → **Color Theme** field.

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

To enable Google Analytics, add your **GA4 Measurement ID** in Studio:

1. Go to Studio → **Site Settings**
2. Find the **Google Analytics Tracking ID** field
3. Enter your Measurement ID — it looks like `G-XXXXXXXXXX`
4. Publish

The GA4 snippet is injected into every page at build time. Leave the field blank to disable analytics entirely — no tracking code will be included in the output.

To find your Measurement ID: Google Analytics → Admin → Data Streams → your stream → Measurement ID.

### Sharecard

When shared on social media, shows `sharecard.jpg` from the root folder. Replace with a **1200 × 630 px** JPG to update.

### Favicon

`favicon.svg` is a placeholder. Replace with a final version when ready.

---

## Changelog

### 2026-11-22 — Post-migration fixes

- **Build perspective fix** — `publishedOnly` → `published` in `netlify.toml` and `sanity-build.js`; production builds were silently failing since the Sanity migration due to an invalid HTTP API perspective value
- **Sanity → Netlify webhook** — publishes in Studio now auto-trigger a Netlify rebuild (~1 min); webhook filter: `project`, `landingPage`, `projectOrder`
- **Homepage ordering** — new `projectOrder` singleton (`liveEdit: true`); drag in Studio → Homepage sidebar item → instantly live, no Publish needed; replaces per-project `orderRank`
- **Studio** — tabs (Content / Media / SEO), color theme swatches, sidebar dividers deployed via `npx sanity deploy`

### 2026-11-22 — Sanity CMS migration
- **Replaced Sveltia CMS with Sanity v3** — Studio at `gabrielle-sirkin.sanity.studio`; all 36 projects, pages, and settings migrated
- **`studio/`** — Sanity Studio v3 with orderable-document-list, media plugin, and custom ColorThemeInput swatch picker
- **`scripts/sanity-build.js`** — GROQ-based content layer; replaces markdown loaders; supports `previewDrafts` perspective for branch deploys
- **Landing pages** — new `landingPage` document type for per-category drag-to-reorder (Brand Strategy, Content Creation, Curation, Production, Visual Direction)
- **Project schema** — reorganized into Content / Media / SEO tabs; `cat` simplified to plain `[string]`; color theme shows color swatches
- **`scripts/fix-thumbnails-og.js`** — clears broken thumbnail refs; backfills `og_image` from thumbnail for all projects
- **`docs/studio-guide.md`** — user guide for Gabrielle
- **Git tag `archive/sveltia-cms`** — marks last Sveltia state for rollback reference

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
