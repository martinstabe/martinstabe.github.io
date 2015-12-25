---
layout: page
title: Links
---

For years, this blog was little more than a collection of links. While working as a digital media repoerter, I started obsessively tagging work-related things I&rsquo;d ussing the [social bookmarking site delicious.com](http://www.delicious.com/martinstabe) and aggregating them on my blog. Astonishingly, many people seemed to find what I did valuable, and this taught me a lot about the interaction of social media communities and journalism. In 2008, the <a href="http://blogs.telegraph.co.uk/technology/shanerichmond/3619871/Ten_excellent_blogs/"><em>Telegraph</em> described my blog</a> as &ldquo;the closest we have to a Romenesko&rdquo;, which was rather flattering. These days, link-aggregation happens mainly [on Twitter](http://www.twitter.com/martinstabe) or [Nuzzel](http://nuzzel.com/martinstabe) Much of what you see here will sadly have succumbed to link rot.

{% for post in site.posts %}
  * {{ post.date | date_to_string }} &raquo; [ {{ post.title }} ]({{ post.url }})
{% endfor %}