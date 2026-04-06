# Migration Spec

## Goal

Migrate this site from Jekyll to a more modern static-site generator while preserving the existing archive, URL structure, and content model. The migration should assume deployment on Cloudflare Pages.

## Current Site Assessment

This repository is a good migration candidate because it relies on relatively little Jekyll-specific functionality. The current implementation is primarily:

- Markdown posts in `_posts/`
- Simple Liquid layouts and includes
- Static pages
- Generated tag pages in `tags/`
- A custom RSS feed
- Sass-based styling
- Static assets in `img/`
- A separate `slides/` section that behaves like standalone static content
- A large data-driven links archive in `_data/links.yml`

The main migration challenge is not application complexity. It is preserving a large legacy archive correctly:

- 1,145 posts in `_posts/`
- 1,238 files in `tags/`
- A large `_data/links.yml` dataset
- Existing long-lived permalinks that must not change

## Recommended Target

The recommended target is **Eleventy (11ty)**.

### Why Eleventy

Eleventy is the best fit for this repository because it is:

- Content-first rather than app-first
- Well suited to Markdown-heavy archives
- Flexible about templating and data files
- Good at generating taxonomy pages such as tag indexes
- Better aligned with this project than a React- or Vue-heavy framework
- Easy to deploy as static output on Cloudflare Pages

### Why Not a Heavier Framework by Default

Astro would also be a reasonable option, especially if this migration is meant to include a broader redesign or richer interactive UI. However, for a mostly static archive, Astro introduces more framework surface area than is currently needed.

Next.js or Nuxt are not recommended as the default path unless the site is being repositioned as an application with dynamic front-end features. That would add complexity without clear benefit for the current content model.

## Deployment Assumption

The migrated site should be deployed on **Cloudflare Pages** rather than GitHub Pages.

### Implications

- The build no longer needs to stay within GitHub Pages’ Jekyll restrictions.
- Node-based tooling becomes the default build environment.
- Static output can be deployed directly from a build directory such as `_site/` or `dist/`.
- Redirects, headers, and edge features can be managed through Cloudflare if needed later.

## Migration Principles

The migration should follow these principles:

- Preserve every existing public permalink exactly.
- Avoid changing content unless required for rendering correctness.
- Replace generated artifacts with build-time logic where possible.
- Keep the migration incremental and reversible until cutover.
- Separate content migration from optional redesign work.
- Treat archival integrity as more important than framework purity.

## Scope of the Initial Migration

The first migration phase should cover:

- Home page
- Blog index
- Individual post pages
- Static pages such as `about/`
- Tag index and tag detail pages
- RSS feed
- Links archive page
- Shared layout and styling
- Static assets in `img/`

The following should remain unchanged initially:

- `slides/` content
- Existing post body content unless rendering breaks
- Legacy metadata fields that are not currently used in templates

## Content and Data Model

### Posts

Posts in `_posts/` should be imported directly into Eleventy collections, preserving:

- `title`
- `author`
- `layout` where useful during transition
- `tags`
- `permalink`
- legacy fields such as `views`, `btc_comment_counts`, `btc_comment_summary`, `oc_metadata`, `oc_commit_id`, and similar front matter

The legacy fields should be preserved in source files even if the new templates ignore them.

### Tag Pages

The `tags/` directory currently contains a large number of manually generated or pre-generated files that exist mainly to support tag archive URLs.

In the new build:

- tag pages should be generated dynamically from post tags
- the `/tags/` index should be generated at build time
- each `/tags/<tag>/` page should be generated at build time
- the existing public tag URLs must be preserved

These `tags/*.md` files should be treated as replaceable build artifacts rather than long-term content.

### Links Archive

The `_data/links.yml` file should become a first-class Eleventy data source.

The `/links/` page should be rebuilt from this data file rather than relying on Jekyll-specific iteration syntax.

### Static Pages

Pages such as `about/index.html` should be ported with minimal structural change at first. Cleanup of imported WordPress-era metadata can be deferred.

### Static Assets

The following should be passed through directly in the initial migration:

- `img/`
- `slides/`
- any verification files such as `googlea1fed2510060dd96.html`
- `CNAME` if still needed operationally

## Technical Migration Plan

### Phase 1: Parallel Scaffold

Create a new Eleventy implementation alongside the existing Jekyll site rather than replacing it immediately.

Recommended high-level structure:

- retain the current content files during transition
- add `package.json`
- add Eleventy config
- add a new source structure for layouts and supporting templates
- configure passthrough copies for `img/` and `slides/`

The Jekyll site should remain buildable until the replacement is verified.

### Phase 2: Base Templates

Port the existing shared templates first:

- default layout
- post layout
- page layout
- header
- footer
- head metadata

At this stage, preserve behavior before changing design.

### Phase 3: Collections and Routing

Implement:

- posts collection
- tag aggregation
- permalink preservation for all posts
- tag index page
- tag detail pages
- blog listing page

The most important requirement is exact URL parity for archived content.

### Phase 4: Data-Driven Pages

Rebuild the links archive from `_data/links.yml`.

This should use Eleventy data loading and sorting rather than static generated pages.

### Phase 5: Feed and Metadata

Recreate the current RSS feed behavior with equivalent output in Eleventy.

This phase should also cover:

- canonical URLs
- page titles
- meta descriptions
- social metadata if added

### Phase 6: Styling Pipeline

Replace the Jekyll Sass pipeline with a Node-based build setup appropriate for Cloudflare Pages.

Acceptable options include:

- Eleventy with Sass preprocessing
- a lightweight bundler such as Vite if needed
- plain compiled CSS if the site remains simple

The initial goal is parity, not visual redesign.

### Phase 7: Cloudflare Pages Build

Configure Cloudflare Pages to build the new site from the Node-based project.

The final build should:

- install dependencies
- run the Eleventy build
- publish the static output directory

Cloudflare Pages should become the source of production deploys after parity is confirmed.

## Cloudflare Pages Requirements

The migration should assume:

- a Node runtime in CI
- static output deployment
- repository-connected builds on push

Expected build pattern:

- build command: project-specific Node build command such as `npm run build`
- output directory: Eleventy output directory such as `_site`

Optional later improvements:

- Cloudflare redirects and headers
- custom caching rules
- edge rewrites if legacy URL quirks require them

## URL Preservation Requirements

These URLs must continue to work exactly as they do now:

- dated post permalinks such as `/2016/03/12/automatic-twitter-lists/`
- tag URLs under `/tags/<tag>/`
- `/tags/`
- `/blog/`
- `/links/`
- `/feed.xml`
- static page URLs such as `/about/`

No migration should proceed to cutover until URL parity has been validated against the current site.

## Content Integrity Risks

The main risks are:

- accidental permalink drift
- template differences affecting old post rendering
- malformed legacy Markdown or HTML inside imported posts
- taxonomy mismatches where tag names contain unusual slugs
- feed output differences
- old third-party embeds that still assume older canonical URLs

These should be treated as migration verification concerns, not reasons to keep Jekyll.

## Legacy Integrations

### Comments

The site currently includes Disqus embeds. This should be preserved temporarily if comment continuity matters, but reviewed carefully because comment identity depends on canonical page URLs.

### Analytics

The site currently uses legacy Google Analytics snippet integration. This should not block the migration. It can either be:

- ported temporarily for parity, or
- replaced with a modern analytics approach after launch

### Slides

The `slides/` directory should remain a passthrough static section in the first migration. It does not need to be re-platformed during the initial site move.

## Verification Plan

Before switching production to the new site:

1. Build both old and new sites locally.
2. Compare generated URLs for posts, tags, pages, and feed.
3. Spot-check representative posts across different years.
4. Verify links, image paths, and canonical tags.
5. Verify the `links/` archive page output.
6. Verify that `slides/` assets are still accessible.
7. Confirm Cloudflare Pages build output matches expectations.

## Recommended Delivery Sequence

1. Scaffold Eleventy and Cloudflare-compatible Node build tooling.
2. Port layouts and shared includes.
3. Port posts and blog index with exact permalinks.
4. Replace static tag files with generated tag pages.
5. Port the links archive from `_data/links.yml`.
6. Recreate the RSS feed.
7. Add Cloudflare Pages configuration and test deploys.
8. Run parity checks and spot audits.
9. Cut over production hosting.
10. Perform optional cleanup and redesign only after successful migration.

## Deferred Work

The following should be explicitly deferred until after the initial migration:

- visual redesign
- content cleanup across old posts
- front matter normalization
- large-scale link-rot remediation
- replacing or removing legacy embeds
- restructuring the `slides/` section

## Recommendation Summary

This site should migrate from Jekyll to **Eleventy**, with **Cloudflare Pages** as the deployment platform. The migration should be executed as a parallel rebuild focused on content preservation, URL parity, and archive integrity. The right first goal is a faithful static replacement, not a redesign.
