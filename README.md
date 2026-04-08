# martinstabe.github.io

This repository now contains a parallel Eleventy implementation of `martinstabe.com`, migrated from the original Jekyll site while preserving the historical content archive and legacy permalink structure.

The original Jekyll source is still present in the repository:

- posts remain in `_posts/`
- Sass sources remain in `css/` and `_sass/`
- legacy tag metadata remains in `tags/`
- the original Jekyll layouts and includes remain in `_layouts/` and `_includes/`

The active Eleventy source lives in `src/`, and the generated deployable output is written to `dist/`.

## Build And Run

Install dependencies:

```bash
npm install
```

Build the site:

```bash
npm run build
```

Sync the FT RSS feed into the local stories YAML source:

```bash
npm run sync:stories
```

Run a local Eleventy dev server:

```bash
npm run dev
```

The current build target is `dist/`. The build script cleans `dist/` before each build so removed routes do not leave stale files behind.

## Deployment

This implementation is intended for Cloudflare Pages.

- build command: `npm run build`
- output directory: `dist`

## Implementation Structure

### Eleventy App

- [eleventy.config.js](/Users/martin.stabe/Documents/martinstabe.github.io/eleventy.config.js)
- [package.json](/Users/martin.stabe/Documents/martinstabe.github.io/package.json)
- [src](/Users/martin.stabe/Documents/martinstabe.github.io/src)

The Eleventy config:

- uses `src/` as the input directory
- uses Nunjucks for layouts and templates
- outputs to `dist/`
- passthrough-copies `img/`, `slides/`, `CNAME`, and the Google verification file
- adds custom filters for relative URLs, human-readable dates, RFC 822 dates, and XML escaping

### Layouts And Partials

Shared templates are in:

- [src/_includes/layouts/default.njk](/Users/martin.stabe/Documents/martinstabe.github.io/src/_includes/layouts/default.njk)
- [src/_includes/layouts/page.njk](/Users/martin.stabe/Documents/martinstabe.github.io/src/_includes/layouts/page.njk)
- [src/_includes/partials](/Users/martin.stabe/Documents/martinstabe.github.io/src/_includes/partials)

These replicate the old Jekyll page shell, header, footer, analytics, social, comments, and head metadata in Eleventy form.

### Content Sources

The Eleventy build does not duplicate the archive into `src/`. Instead it imports the existing source content:

- blog posts from [_posts](/Users/martin.stabe/Documents/martinstabe.github.io/_posts)
- tag metadata from [tags](/Users/martin.stabe/Documents/martinstabe.github.io/tags)
- links archive data from [_data/links.yml](/Users/martin.stabe/Documents/martinstabe.github.io/_data/links.yml)

## Additional Features Added During Migration

The Eleventy implementation includes behavior that did not previously exist as a single coherent layer in the Jekyll site.

### Stories Section From FT RSS

Stories sourced from the FT RSS feed can now be synced into [_data/stories.yml](/Users/martin.stabe/Documents/martinstabe.github.io/_data/stories.yml) with [scripts/sync_stories.js](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/sync_stories.js).

Each synced entry is stored as YAML and preserves manual overrides on subsequent syncs, including the `include: false` switch to exclude an item from the generated site.

Included stories are rendered into the new `/stories/` section and linked from the main navigation.

#### Updating Stories

Source:

- RSS feed: `https://www.ft.com/martin-stabe?format=rss`
- local cache: [_data/stories.yml](/Users/martin.stabe/Documents/martinstabe.github.io/_data/stories.yml)
- sync script: [scripts/sync_stories.js](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/sync_stories.js)

To refresh the Stories section:

```bash
npm run sync:stories
npm run build
```

Notes:

- the sync merges by feed `guid`
- new feed items default to `include: true`
- setting `include: false` on any item suppresses it from `/stories/`
- manual edits in `_data/stories.yml` can be used to override display text or links before rebuilding
- the generated Stories page links outward to the canonical FT URLs

### Graphics Section From FT Asset Database

Graphics sourced from the FT elections newsbox asset database can now be synced into [_data/graphics.yml](/Users/martin.stabe/Documents/martinstabe.github.io/_data/graphics.yml) with [scripts/sync_graphics.js](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/sync_graphics.js) and [scripts/export_graphics.R](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/export_graphics.R).

The sync filters records to `flourish_author == "Martin Stabe"`, transforms the fields required for the site, preserves manual `include: false` overrides, and renders included entries into the `/data-visualisation/` section as outbound links to FT.com.

#### Updating Data Visualisation

Source:

- R data file: set `GRAPHICS_SOURCE_URL` in your environment before running the sync
- local cache: [_data/graphics.yml](/Users/martin.stabe/Documents/martinstabe.github.io/_data/graphics.yml)
- sync scripts: [scripts/sync_graphics.js](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/sync_graphics.js) and [scripts/export_graphics.R](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/export_graphics.R)

To refresh the Data Visualisation section:

```bash
npm run sync:graphics
npm run build
```

The sync currently:

- downloads the remote `.rds` file
- filters rows to `flourish_author == "Martin Stabe"`
- transforms the selected fields into YAML entries
- stores the results in `_data/graphics.yml`
- preserves manual `include: false` overrides on existing items

### Tag Deduplication And Alias Merging

Multiple tag tokens can now map to the same rendered tag page simply by pointing their legacy `tags/*.md` files at the same permalink.

Example:

- `ft`
- `financialtimes`
- `financial-times`

This affects:

- the generated tag index
- individual tag pages
- the tag footer on each post
- inline legacy tag links embedded inside imported HTML posts

### Canonical Post Footer Tags

Post pages are generated through [src/posts.njk](/Users/martin.stabe/Documents/martinstabe.github.io/src/posts.njk) using metadata prepared in [src/_data/posts.js](/Users/martin.stabe/Documents/martinstabe.github.io/src/_data/posts.js).

The footer tag list now uses canonical tag definitions rather than raw front matter values, so a post tagged `ft` can render as `Financial Times` and link to the canonical merged tag page.

### Legacy Inline Tag Link Rewriting

Some older imported posts, especially the `links-for-*` archive entries, contain literal HTML with embedded `/tags/.../` links in the body.

Those links are now rewritten during the Eleventy import step so they resolve to the canonical tag permalink rather than an obsolete or duplicate path.

### Special Handling For Delicious Archive Posts

Many `links-for-*` posts are already HTML rather than Markdown. The importer in [src/_data/posts.js](/Users/martin.stabe/Documents/martinstabe.github.io/src/_data/posts.js) detects those entries and bypasses Markdown rendering so they do not get mangled into escaped code blocks.

### Relative Internal Links For Local Review

The Eleventy build uses a custom `relativeUrl` filter so internal links are written relative to the current page. This makes manual inspection of the generated `dist/` output work correctly when served from a local static server.

Canonical and feed URLs remain absolute where appropriate.

### RSS Feed Recreation

The RSS feed is generated by [src/feed.njk](/Users/martin.stabe/Documents/martinstabe.github.io/src/feed.njk), using Eleventy data and custom XML/date filters to approximate the old Jekyll feed behavior.

### Links Archive Rebuilt From Data

The `/links/` page is now generated from [_data/links.yml](/Users/martin.stabe/Documents/martinstabe.github.io/_data/links.yml) through [src/_data/links.js](/Users/martin.stabe/Documents/martinstabe.github.io/src/_data/links.js) and [src/links/index.njk](/Users/martin.stabe/Documents/martinstabe.github.io/src/links/index.njk), rather than relying on Jekyll template iteration.

### Jekyll Sass Reused In Node Build

The original Jekyll Sass has been retained and compiled via Node:

- [scripts/build_sass.js](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/build_sass.js)
- [css/main.scss](/Users/martin.stabe/Documents/martinstabe.github.io/css/main.scss)
- [_sass](/Users/martin.stabe/Documents/martinstabe.github.io/_sass)

This preserves the historical styling rather than replacing it with a new CSS layer.

### Clean Build Output

The build now removes `dist/` first using [scripts/clean_dist.js](/Users/martin.stabe/Documents/martinstabe.github.io/scripts/clean_dist.js). This prevents stale generated pages from surviving route changes, which is especially important for merged tag aliases.

### Footer Social Update

The Eleventy footer partial at [src/_includes/partials/footer.njk](/Users/martin.stabe/Documents/martinstabe.github.io/src/_includes/partials/footer.njk) has been updated to point to Bluesky instead of the legacy Twitter profile, including a new icon and layout adjustments to accommodate the longer handle.

## Current Page Coverage

The Eleventy build currently generates:

- home page
- blog index
- individual post pages
- tag index
- tag detail pages
- links archive
- about page
- RSS feed

Static assets are passed through for:

- `img/`
- `slides/`
- `CNAME`
- `googlea1fed2510060dd96.html`

## Notes

- The original Jekyll site remains in the repository for reference during migration.
- The generated `dist/` directory is a build artifact and should not be edited directly.
- The Sass pipeline currently emits deprecation warnings from the legacy stylesheet source, but the build completes successfully.
