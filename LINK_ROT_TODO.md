# External Link Repair TODO

- Status as of 2026-04-06: both legacy taxonomy migrations are complete.
- Completed: all 264 `links-for-*` posts now use normalized Jekyll `tags:` front matter, and their inline parenthesized Delicious tag links now point to local tag pages.
- Completed: all 1,145 posts that previously used `categories:` now use `tags:` instead, and post footers now link to local tag pages rather than empty category URLs.
- Completed: tag archives were regenerated from the full post set. There are now 1,237 tag pages plus the tag index at `/tags/`.
- Reference files: [link_check_report.json](/Users/martin.stabe/Documents/martinstabe.github.io/link_check_report.json), [_layouts/tag.html](/Users/martin.stabe/Documents/martinstabe.github.io/_layouts/tag.html), [_layouts/post.html](/Users/martin.stabe/Documents/martinstabe.github.io/_layouts/post.html), [tags/index.html](/Users/martin.stabe/Documents/martinstabe.github.io/tags/index.html).

## Completed Migration

- [x] Remove dependency on `del.icio.us/martinstabe/*` and `delicious.com/martinstabe/*` tag URLs inside `links-for-*` posts.
- [x] Preserve the existing inline `(tags: ...)` blocks while retargeting them to local Jekyll tag pages.
- [x] Normalize imported tag slugs by lowercasing, converting underscores to hyphens, and fixing obvious typos.
- [x] Replace the old category-based footer links with tag-based footer links in [_layouts/post.html](/Users/martin.stabe/Documents/martinstabe.github.io/_layouts/post.html).
- [x] Remove `categories:` front matter from the post archive and merge those values into normalized `tags:`.

## Refreshed Audit Summary

- The current prioritized audit in [link_check_report.json](/Users/martin.stabe/Documents/martinstabe.github.io/link_check_report.json) checked 281 high-impact external URLs from the current migrated tree.
- Results: 69 dead links, 126 redirects worth updating, and 48 manual-review responses.
- The high-signal remaining work is now mostly ordinary stale external content, especially old FT project URLs, old self-links under `www.martinstabe.com`, legacy slides references, and a handful of domains that now 403, 404, timeout, or fail DNS resolution.

## Highest Priority Remaining Fixes

- [ ] Replace or remove broken legacy self-links under `http://www.martinstabe.com/blog/archives/...`. The refreshed audit found 20 distinct dead URLs on `www.martinstabe.com`, accounting for 63 occurrences in the prioritized set.
- [ ] Review dead FT and FT-blog project links. The refreshed audit found repeated 404s for `blogs.ft.com`, `www.ft.com/firemap`, and old FT interactive/article URLs.
- [ ] Review dead slide-deck links separately. The refreshed audit still surfaces slide references such as dead Knight Lab, Tumblr, BBC, Carto, Huffington Post Pollster, and Zeit URLs.
- [ ] Remove or replace OpenCalais entity links in [_posts/2008-09-22-planning-applications-hyperlocal-news.md](/Users/martin.stabe/Documents/martinstabe.github.io/_posts/2008-09-22-planning-applications-hyperlocal-news.md). These still redirect to Thomson Reuters and no longer point to meaningful entity pages.

## Remaining Content Fixes

- [ ] Replace or remove `http://www.martinstabe.com/blog/archives/2005/02/british_blogs_a.php` in 10 posts, including [_posts/2005-11-18-british-blogs-get-some-attention.md:34](/Users/martin.stabe/Documents/martinstabe.github.io/_posts/2005-11-18-british-blogs-get-some-attention.md#L34).
- [ ] Replace or remove `http://www.delicious.com/martinstabe` in [_posts/2010-11-24-pimp-my-blog-blogging-reading-writin.md:41](/Users/martin.stabe/Documents/martinstabe.github.io/_posts/2010-11-24-pimp-my-blog-blogging-reading-writin.md#L41) and [links/index.md:6](/Users/martin.stabe/Documents/martinstabe.github.io/links/index.md#L6).
- [ ] Replace or remove `https://bsky.app/profile/martinstabe.bsky.social` in [index.html:16](/Users/martin.stabe/Documents/martinstabe.github.io/index.html#L16) and [about/index.html:20](/Users/martin.stabe/Documents/martinstabe.github.io/about/index.html#L20).
- [ ] Replace or remove `http://journalisted.com/martin-stabe` in [index.html:16](/Users/martin.stabe/Documents/martinstabe.github.io/index.html#L16).
- [ ] Replace or remove `http://www.britishbaseball.org/page/show/286039-team-gb` in [about/index.html:18](/Users/martin.stabe/Documents/martinstabe.github.io/about/index.html#L18).

## Redirects Worth Updating

- [ ] Update `http://www.ft.com/interactive` to `https://www.ft.com/visual-and-data-journalism` across 38 occurrences.
- [ ] Update `http://martinstabe.com/blog/?p=1348` to `http://www.martinstabe.com/blog/?p=1348` across 34 occurrences.
- [ ] Update `http://seeyalaterallidata.wordpress.com/2013/03/07/data-journalism-at-the-bbc-interview-with-bella-hurrell/` to its `https://` URL across 20 occurrences.
- [ ] Update `http://ig.ft.com/austerity-map/` to `https://ig.ft.com/austerity-map/` across 19 occurrences.
- [ ] Update `http://www.ft.com/ig/features/baseline/greatest-tennis-players-of-all-time/` to `https://ig.ft.com/features/baseline/greatest-tennis-players-of-all-time/` across 16 occurrences.
- [ ] Replace or remove OpenCalais `s.opencalais.com` and `d.opencalais.com` links that now redirect to Thomson Reuters. In the refreshed audit these still account for 13 redirecting URLs and 80 occurrences in the prioritized set.
- [ ] Update the remaining obvious homepage/profile redirects on [about/index.html](/Users/martin.stabe/Documents/martinstabe.github.io/about/index.html), including FT, Governing, London Mets, and related profile links.
- [ ] Decide whether to keep historical Twitter branding or update `twitter.com` profile/status links to `x.com` equivalents where redirects are now stable.

## Manual Review

- [ ] Review `www.ft.com` URLs returning 403 or DNS-style failures in the refreshed audit. These account for 8 prioritized URLs and 60 occurrences.
- [ ] Review `elections.ft.com` URLs returning DNS-style failures in the refreshed audit. These account for 4 prioritized URLs and 29 occurrences.
- [ ] Review `blogs.telegraph.co.uk` URLs returning DNS-style failures in the refreshed audit.
- [ ] Review one-off timeout or service-failure domains such as `www.washingtonpost.com`, `api.stlouisfed.org`, `berlinwahlkarte2013.morgenpost.de`, and `datos.rtve.es`.

## Follow-Up Audit

- [ ] Re-run the prioritized link audit after the next batch of content fixes so [link_check_report.json](/Users/martin.stabe/Documents/martinstabe.github.io/link_check_report.json) reflects the updated state again.
- [ ] If needed, run a broader audit focused just on `slides/` because that directory still contains a disproportionate share of stale external references.
