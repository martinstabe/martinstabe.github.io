---
title: 'Independent: robots.txt'
author: Martin Stabe
layout: post
permalink: /2008/03/13/independent-robotstxt/
views:
  - 232
btc_comment_counts:
  - 'a:0:{}'
btc_comment_summary:
  - 'a:0:{}'
categories:
  - ACAP
  - Independent
  - links
  - robotstxt
---
The [Indy has adopted ACAP][1]. But while the old Robots Exclusion Standard commands include a link to a sitemap, the ACAP commands do not.

**Update:** ACAP explains what&#8217;s going on in a detailed e-mail:

> The main point to be made in response is that ACAP Version 1.0 extends the functionality already available in &#8216;robots.txt&#8217; and doesn&#8217;t invalidate any of the existing functionality. Indeed, it has already been shown in last year&#8217;s tests that the ACAP extensions to REP complement the sitemaps protocol. Macmillan, one of the publishers that collaborated closely on the development and testing of ACAP Version 1.0, makes significant use of sitemaps and they demonstrated in their tests of ACAP Version 1.0 that ACAP policies expressed in REP can be used in conjunction with sitemaps to provide rich metadata to crawlers.
> 
> We did consider last year whether or not to use sitemaps to communicate ACAP policies, but the decision was taken only to provide a mechanism for communicating those policies using REP. There are a number of reasons for this. The main reason is that we were advised by our contacts in the search engine community that we needed to make a clear distinction between REP, which is used for policy communication &#8211; i.e. telling crawlers what they should or should not do with content &#8211; and sitemaps, which is purely informative about the content on a site. Another reason was that REP already provided a mechanism for addressing crawlers by name, whereas sitemaps does not, and it would involve a big change to sitemaps to enable its contents to be addressed to specific crawlers.
> 
> However, we are still considering the relationship between sitemaps and ACAP and it is quite likely that we will need to extend ACAP to make the relationship clearer than it currently is. For example, we recognise that there is ambiguity in ACAP Version 1.0 as to what is the status of a Sitemaps field in robots.txt, if the ACAP policy includes a request to crawlers to ignore conventional REP records. This will need to be resolved in the next version of the ACAP technical framework.
> 
> In spite of the decision last year not to specify how sitemaps could be used to convey ACAP policies, we have not permanently ruled that out as an option, and we know that Macmillan at least are keen for us to continue to look at this. We have an XML format for ACAP policies available in draft, and it would be a relatively simple matter to show how this might be embedded in sitemaps, should the business case be made for doing

 [1]: http://www.independent.co.uk/robots.txt