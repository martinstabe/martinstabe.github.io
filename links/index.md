---
layout: page
title: Links
---

For years, this blog was little more than a collection of links. While working as a digital media repoerter, I started obsessively tagging work-related things using the [social bookmarking site delicious.com](http://www.delicious.com/martinstabe) and aggregating these to my blog as simple posts. Astonishingly, many people seemed to find what I did valuable, and this taught me a lot about the interaction of social media communities and journalism. In 2008, the <a href="http://blogs.telegraph.co.uk/technology/shanerichmond/3619871/Ten_excellent_blogs/"><em>Telegraph</em> described my blog</a> as &ldquo;the closest we have to a Romenesko&rdquo;, which was rather flattering. These days, link-aggregation happens mainly [on Twitter](http://www.twitter.com/martinstabe) or [Nuzzel](http://nuzzel.com/martinstabe). Much of what you see here will sadly have succumbed to link rot.

<div class="home">

  <ul class="post-list">
    {% for link in site.data.links | sort:link.post_date %}

      <li class="link">
        <span class="post-meta">{{ link.post_date | date: "%B %-d, %Y" }}</span>

        <h2><span class="post-link">{{% if link.publication %}}{{ link.publication }}: {{% endif %}}<a href="{{ link.permalink }}">{{ link.title }}</a></span></h2>

		<p>{{ link.post_content }}</p>

        </li>

    {% endfor %}
  </ul>

</div>



