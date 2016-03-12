---
title: 'How to follow a conference with an automated Twitter list'
author: Martin Stabe
layout: post
categories:
  - Twitter
  - Nuzzel
  - IFTTT
---

Some people attending [NICAR](http://www.ire.org/conferences/nicar2016/) or [Malofiej](http://www.malofiejgraphics.com/) conferences have noticed that I added them to an auto-generated Twitter lists ([/nicar16](https://twitter.com/martinstabe/lists/nicar16) or [/malofiej](https://twitter.com/martinstabe/lists/malofiej)) shortly after they used the conference hashtag, and have asked how to do this.

Since the two most important conferences in my field were happening simultaneously in different time zones, and I could attend neither, I wanted to track them on Twitter, without being overwhelmed by the conference chatter. 

I like using Nuzzel, powered by Twitter lists, to keep up  with the most-shared links in various communities, so I needed a list of everyone tweeting about the conferences. Since I'm too <s>busy</s> lazy to manually curate attendee lists, I automated the process using IFTTT.

You'll need:

* a Twitter account with [the list you want to use](https://twitter.com/martinstabe/lists/nicar16) set up.
* an [IFTTT](https://ifttt.com) account with Twitter connected as an active Channel
* optionally, an account on [Nuzzel](http://nuzzel.com/) or [Flipboard](https://flipboard.com/) with your Twitter list set up as a custom source

First, create a new Twitter list:

![Twitter auto-list screenshot step 1]({{ site.url }}/img/twitterlist1.png)

Then go to IFTTT and create a new recipe (or just clone [the one I made earlier](https://ifttt.com/recipes/396001-twitter-list-from-hashtag)) using a Twitter search as the trigger, and enter the conference hashtag as the search term:

![Twitter auto-list screenshot step 2]({{ site.url }}/img/twitterlist2.png)

Then also set Twitter as the resulting action, using the "add user to list" function.

![Twitter auto-list screenshot step 3]({{ site.url }}/img/twitterlist3.png)

This will add any user who uses the hashtag to the list. You'll inevitably get some false positives — especially people like yourself who are missing the conference but following along anyway. Luckily, they are likely to be Tweeting about similar things:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Oh <a href="https://twitter.com/martinstabe">@martinstabe</a>, if only <a href="https://t.co/lV02Fa37Q6">pic.twitter.com/lV02Fa37Q6</a></p>&mdash; Elliot Bentley (@elliot_bentley) <a href="https://twitter.com/elliot_bentley/status/708286898645630977">March 11, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

If the conference is popular and its hashtag starts trending, spammers may latch on to it. If that happens, you'll need to do some manual pruning of your auto-generated list.

As an optional final step, add the new list to your Nuzzel account (eg mine for [#nicar16](http://nuzzel.com/martinstabe/nicar16) and  [malofiej24](http://nuzzel.com/martinstabe/malofiej)). You can use this to aggregate your list to surface only the most popular or trending links, or getting a newsletter of what was popular at the conference. This is especially useful if you are sleeping in another timezone while the conference is going on. Alternatively, you can just follow the list directly on Twitter or add it to Tweetdeck follow what people interested in the conference are talking about.

Got any suggestions for improving this? Please let me know in the comments!
