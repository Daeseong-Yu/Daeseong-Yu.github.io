---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: archive
title: Home
author_profile: true
---

<h2>Recent Posts</h2>

<div id="post-list">
  {% for post in site.posts %}
    {% if post.lang == "ko" or post.lang == "en" %}
      <div class="language-post" data-lang="{{ post.lang }}" hidden>
        {% include archive-single.html %}
      </div>
    {% endif %}
  {% endfor %}
</div>

{% include language-filter.html %}