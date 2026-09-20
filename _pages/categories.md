---
title: "Categories"
layout: archive
permalink: /categories/
author_profile: true
---

{% for category in site.categories %}
  <section class="taxonomy__section language-group">
    <h2 id="{{ category[0] | slugify | downcase }}" class="archive__subtitle">
      {{ category[0] }}
    </h2>

    <div class="entries-list">
      {% for post in category[1] %}
        {% if post.lang == "ko" or post.lang == "en" %}
          <div class="language-post" data-lang="{{ post.lang }}" hidden>
            {% include archive-single.html %}
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </section>
{% endfor %}

{% include language-filter.html %}