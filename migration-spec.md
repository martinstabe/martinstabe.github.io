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
- Static output should be deployed from `dist/`.
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
- configure Eleventy output to `dist/`

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

### Phase 8: Post-Migration Enhancements

After deployment parity has been achieved, low-priority enhancements can be tackled separately from the launch-critical migration work.

This phase may include:

- Open Graph metadata
- Twitter card metadata or equivalent social-sharing metadata
- richer page-type-specific metadata beyond the minimum needed for deployment
- optional tidy-up work that improves presentation but does not affect URL parity or launch readiness

## Cloudflare Pages Requirements

The migration should assume:

- a Node runtime in CI
- static output deployment
- repository-connected builds on push

Expected build pattern:

- build command: project-specific Node build command such as `npm run build`
- output directory: `dist/`

Optional later improvements:

- Cloudflare redirects and headers
- custom caching rules
- edge rewrites if legacy URL quirks require them

## URL Preservation Requirements

For the initial deployment, the parity contract is intentionally narrower than "every URL currently on the domain".

The required contract is:

- any URL on `martinstabe.com` or `www.martinstabe.com` that is linked to from `https://www.martinstabe.com/blog/`, either directly or by recursive traversal of internal links starting from that page, must also exist on the new site

This means:

- all dated post permalinks reachable from the blog archive must continue to exist
- all tag pages, archive pages, and other internal HTML routes reachable from the blog archive must continue to exist
- additional pages may be present on the new site, even if they are not present on the current live site

For this audit, URL comparison should:

- normalize away scheme and host
- ignore fragments
- treat `/index.html` and the directory URL as equivalent
- preserve path semantics closely enough to catch real permalink drift, including trailing-slash differences where relevant

No migration should proceed to cutover until this `/blog/`-rooted URL parity has been validated against the current live site.

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

1. Crawl `https://www.martinstabe.com/blog/` and recursively follow only internal links on `martinstabe.com` and `www.martinstabe.com`.
2. Record every discovered internal URL path and normalize it into a parity inventory.
3. Build the new Eleventy site from a clean `dist/`.
4. Enumerate all generated local routes from `dist/` into the same normalized path format.
5. Compare the live `/blog/`-rooted inventory against the built local route inventory.
6. Triage every missing path as either:
   - a required compatibility route to add
   - an allowed exclusion with a written reason
7. Spot-check representative posts across different years, including HTML-heavy and link-roundup posts.
8. Verify the `links/` archive page output.
9. Verify that `slides/` assets are still accessible where they are part of the generated site contract.
10. Confirm Cloudflare Pages build output matches expectations.

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

## Current Progress Assessment

Assessment date: 2026-04-09

The repository is no longer at the planning or scaffold stage. A substantial parallel Eleventy implementation already exists alongside the legacy Jekyll site, and most of the initial migration scope described in this spec has been implemented.

### Implemented

The following migration work is present in the repository:

- a parallel Eleventy app with [`package.json`](./package.json), [`eleventy.config.js`](./eleventy.config.js), and a dedicated [`src/`](./src/) tree
- Node-based build output targeting `dist/`
- passthrough handling for `img/`, `slides/`, `CNAME`, and the Google verification file
- shared Eleventy layouts and partials covering the page shell, header, footer, analytics, comments, and head metadata
- direct post import from `_posts/` into Eleventy data
- generated post pages using legacy permalinks
- generated tag index and tag detail pages driven from legacy tag definitions
- a links archive page rebuilt from `_data/links.yml`
- an Eleventy RSS feed
- a Node-based Sass compilation step that reuses the existing Jekyll Sass sources

The current Eleventy implementation also includes additional sections beyond the initial migration scope, notably `stories/` and `data-visualisation/`.

### Verified Repository State

The following observations are confirmed from the current codebase:

- `_posts/` contains 1,145 posts, and the Eleventy post importer currently reads all 1,145
- `tags/` contains 1,237 legacy tag definition files
- the generated tag model resolves those legacy definitions into 1,235 rendered tag routes with no missing legacy tag permalinks
- the main routes in scope for the initial migration are present in Eleventy source:
  - home page
  - blog index
  - individual post pages
  - tag index
  - tag detail pages
  - links archive
  - about page
  - RSS feed

### Remaining Gaps And Risks

Despite the amount of completed implementation work, the migration should not yet be treated as cutover-ready.

The main unresolved concerns are:

- the `/blog/`-rooted live URL parity contract has not yet been formalized into a repeatable crawl-and-diff check
- no migration-specific parity audit artifacts are currently recorded in the repository
- Cloudflare Pages deployment is documented, but an actual Pages configuration or verified deployment setup has not yet been confirmed in-repo
- metadata parity is only partial: canonical URLs, titles, descriptions, and feed behavior still need explicit verification against the live site before deployment
- `package.json` does not explicitly declare all packages used directly by the Eleventy data layer, including `js-yaml`, `markdown-it`, and `entities`
- a clean rebuild after manually clearing `dist/` completed successfully on 2026-04-09 and did not reproduce the earlier `2003 2` / `2004 2` style directory anomalies, which strongly suggests those paths were caused by a local-machine interaction rather than current Eleventy routing logic
- at least one imported legacy post lacks a `title` field and will need editorial review during parity checking

### Phase Status Summary

The current status against the migration plan is:

- Phase 1: substantially implemented
- Phase 2: substantially implemented
- Phase 3: substantially implemented
- Phase 4: substantially implemented
- Phase 5: partially implemented
- Phase 6: implemented
- Phase 7: only partially evidenced
- Phase 8: not started and intentionally deferred

In practical terms, most of the migration build has already been done. The remaining work is primarily verification and hardening:

1. declare direct Node dependencies explicitly
2. implement and run a repeatable `/blog/`-rooted live URL crawl and parity diff against `dist/`
3. spot-audit representative old posts, tags, links pages, and feed output
4. complete Phase 5 metadata parity work
5. confirm a reproducible Cloudflare Pages deployment path before cutover

### Next Steps For Phase 5

Phase 5 is no longer blocked by the earlier `dist/` anomaly. The next work to complete this phase should focus on feed and metadata parity that is necessary for deployment, not optional social enhancements:

1. review the generated RSS feed against the legacy Jekyll feed and document any differences in item count, content encoding, category output, GUIDs, and timestamps
2. verify that canonical URLs always resolve to the intended public production domain and are not still pointing at a legacy or temporary hostname
3. decide whether posts, pages, and tag pages need distinct metadata behavior, then implement the minimum page-type-specific defaults required for parity and sane search/index behavior
4. audit a representative sample of old posts with difficult content, including HTML-heavy entries and link roundup posts, to ensure their feed descriptions and page descriptions are not malformed
5. record the accepted Phase 5 launch criteria in this spec or a deployment note so deployment is not blocked by non-essential metadata work

### Phase 8 Backlog

The following items are intentionally out of scope for launch and should be handled only after deployment parity is complete:

1. add Open Graph metadata to the shared head partial
2. add Twitter card metadata or equivalent social-sharing tags if still useful
3. extend metadata behavior for richer social previews and sharing presentation
4. perform non-essential metadata tidy-up that does not affect routing, indexing, or feed parity

## Recommendation Summary

This site should migrate from Jekyll to **Eleventy**, with **Cloudflare Pages** as the deployment platform. The migration should be executed as a parallel rebuild focused on content preservation, URL parity, and archive integrity. The right first goal is a faithful static replacement, not a redesign.
