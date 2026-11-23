# Studio Guide — gabriellejsirkin.com

**Studio URL:** https://gabrielle-sirkin.sanity.studio

This is where you manage all content for your site — projects, page text, navigation, and site settings.

---

## Adding or editing a project

1. Open **Projects** in the left sidebar
2. Click an existing project to edit, or click **+ Create new document** to add one
3. Fill in the fields (see field reference below)
4. Click **Publish** (green button, top right) when ready to go live

Changes save automatically as a draft while you work. Nothing goes live until you click Publish.

### Project fields

| Field | What it's for |
|---|---|
| **Title** | Project name shown on the site |
| **Slug** | URL key — auto-generated from title, don't change after publishing |
| **Categories** | Which category filters this project appears in (e.g. "Brand Strategy", "Visual Direction") |
| **Client** | Client name shown in project meta |
| **Date** | Year shown in project meta |
| **Description** | Main text shown above the meta section. Supports basic markdown. |
| **Credits** | Full credits line |
| **Skills** | Tags shown in the project footer |
| **Thumbnail** | Image used for the project card on the homepage |
| **Card ratio** | Aspect ratio of the card image (e.g. 4:3, 16:9, 3:4) |
| **Media** | All images and videos shown on the project page, in order |
| **Coming Soon** | Hides from filters; shows a placeholder card |
| **Color Theme** | Optional page accent color |
| **SEO fields** | Custom title/description/image for social sharing |

---

## Reordering projects

There are two independent ordering systems:

### Homepage / "All" filter order
This controls the order when no filter is active.

1. Open **Projects** in the sidebar
2. The list shows projects in their current order — drag the handle (⠿) on the left of any row to reorder
3. Changes save automatically

### Per-category order
Each category has its own landing page document that controls project order within that filter.

1. Open **Landing Pages** in the sidebar
2. Click the category you want to reorder (e.g. "Brand Strategy")
3. Drag the project rows to your preferred order
4. Click **Publish**

The two orderings are independent — a project's position in "All" doesn't affect its position in any category filter.

---

## Uploading images and videos

Images and videos are managed through Sanity's asset library. You can upload them:

- **Directly into a project** — open the project, click the image/media field, upload from there
- **From the Media library** — click **Media** in the sidebar to browse, search, and upload all assets in one place

Supported formats: JPG, PNG, WebP, GIF, MP4. Upload originals — the site generates optimized sizes automatically.

---

## Editing page content

### Homepage
Open **Pages → Home** to edit the hero text and SEO settings.

### About page
Open **Pages → About** to edit the headline, bio, sidebar photo, skills list, and services text.

### Services / Travel page
Open **Pages → Services** to edit all content on the services and city guides page.

---

## Site settings
Open **Site Settings** to edit:
- Site title and description
- Navigation links
- Contact info (email, Instagram, LinkedIn)
- Global SEO defaults

---

## Drafts vs. published

- Every document has a **draft** state (your work in progress) and a **published** state (what's live on the site)
- Edits auto-save to your draft — nothing changes on the live site until you click **Publish**
- To discard unsaved changes, click the ••• menu → **Discard changes**
- To unpublish a document, click the ••• menu → **Unpublish**

The site rebuilds on Netlify within about 30 seconds of publishing.

---

## Tips

- **To change a project's thumbnail:** open the project → Thumbnail field → upload or select an image
- **To reorder media on a project page:** open the project → Media field → drag items into order
- **To add a new category to a project:** open the project → Categories field → type the category name exactly as it appears elsewhere (capitalization matters)
- **If a project should appear in multiple categories:** add all relevant categories to the Categories field
