+++
title = "Zola Tuning"
date = 2025-01-13T20:49:16-03:00
[taxonomies]
tags = ['Zola', 'Static Site Generator', 'Performance', 'SEO']
series = ['Zola Step by Step']
[extra]
add_toc = true
series = true
+++

In previous articles, we've created a static site using Zola and made it multilingual. While this might serve as a basic introduction, I believe we can make a few tweaks to improve the site further. In this post, we'll configure some settings, display emojis, install external libraries, and set up a search page, among other adjustments.


Author Name
-----------

If you've checked the feeds, you may have noticed that the author's name is missing. Let's begin by setting the `author` variable to resolve this.

```bash
ed config.toml << HEREDOC
3i

# The default author for pages
author = "Juan Manuel Lopez"
.
wq
HEREDOC
```

To make the site more accessible and easier to navigate, let's add a link to the feeds in the main menu.

```bash
ed config.toml << HEREDOC
57a
    { name = "!feed", url = "/atom.xml" },
.
wq
HEREDOC
```


Markdown Content
----------------

In the configuration file, under the `[markdown]` section, there are several variables we can set or modify to control how Markdown is processed. One of these variables is `render_emoji`, which enables us to convert emoji aliases into Unicode emojis. You can check the [emoji-cheat-sheet](https://github.com/ikatyang/emoji-cheat-sheet/) if you can't remember an emoji alias.

```bash
ed config.toml << HEREDOC
23i

# Translate emoji aliases to corresponding Unicode emoji equivalent
render_emoji = true
.
wq
HEREDOC
```

Zola offers other variables to highlight code blocks, but using them would alter how the code is rendered in the HTML. Specifically, it would add tags for code highlighting, making the raw HTML less readable. Therefore, I prefer to use a JavaScript library for this task, leaving the HTML `<code>` blocks untouched. For code highlighting, we'll use [Highlight.js](https://github.com/highlightjs/highlight.js), and for adding a **copy to clipboard** button, we'll use [highlightjs-copy](https://github.com/arronhunt/highlightjs-copy).

Rather than loading these libraries directly in the base template, we'll modularize the templates by placing them in an external (partial) template file, which will be included in the base template. To do this, start with the Tera instruction to [include](https://keats.github.io/tera/docs/#include) an external template file.

```bash
ed templates/base.html << HEREDOC
97a
        {% include "partials/head.html" ignore missing -%}
.
wq
HEREDOC
```

Now, let's install (download) [highlight.js@11.9.0](https://github.com/highlightjs/highlight.js/releases/tag/11.9.0). I've chosen to download the library instead of linking to the CDN to demonstrate the process and to ensure the site functions locally in an offline environment.

```bash
mkdir -p static/lib/highlight.js && \
curl --location --output static/lib/highlight.js/highlight.min.js 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js' && \
curl --location --output static/lib/highlight.js/highlight.min.css 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
```

Next, let's install (download) [highlightjs-copy@1.0.6](https://github.com/arronhunt/highlightjs-copy/releases/tag/1.0.6).

```bash
mkdir -p static/lib/highlightjs-copy && \
curl --location --output static/lib/highlightjs-copy/highlightjs-copy.min.js 'https://unpkg.com/highlightjs-copy@1.0.6/dist/highlightjs-copy.min.js' && \
curl --location --output static/lib/highlightjs-copy/highlightjs-copy.min.css 'https://unpkg.com/highlightjs-copy@1.0.6/dist/highlightjs-copy.min.css'
```

Once the libraries are installed, we need to initialize and call them once the page is loaded. We can do this with the following code.

```bash
cat << HEREDOC > static/custom.js
/**
 * Function to set up code highlighting and enable copy button
 *
 * @see https://highlightjs.readthedocs.io/en/latest/readme.html#in-the-browser
 */
function initializeCodeHighlighting() {
    // Add a copy button feature to all code blocks
    // The 'autohide: false' means the copy button will always be visible
    hljs.addPlugin(
        new CopyButtonPlugin({
            autohide: false,
        })
    );

    // Apply syntax highlighting to all code elements on the page. This will
    // automatically highlight any code blocks using the 'highlight.js' library.
    hljs.highlightAll();
}

// Set up the code highlighting once the page content is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeCodeHighlighting();
});
HEREDOC
```

Finally, create the `head.html` (partial) template file, which will be injected into the `head` section using the instruction we declared earlier. This file is responsible for linking the libraries, as well as our custom code and styles.

```bash
mkdir -p templates/partials && \
cat << HEREDOC > templates/partials/head.html
{# -------------------------------------------------------------------------------- -#}
{# Load highlight.js [https://github.com/highlightjs/highlight.js] -#}
<link rel="stylesheet" href="{{/* get_url(path='lib/highlight.js/highlight.min.css') */}}">
<script src="{{/* get_url(path='lib/highlight.js/highlight.min.js') */}}"></script>
{# -------------------------------------------------------------------------------- -#}
{# Load copy to clipboard plugin [https://github.com/arronhunt/highlightjs-copy] -#}
<link rel="stylesheet" href="{{/* get_url(path='lib/highlightjs-copy/highlightjs-copy.min.css') */}}">
<script src="{{/* get_url(path='lib/highlightjs-copy/highlightjs-copy.min.js') */}}"></script>
{# -------------------------------------------------------------------------------- -#}
{# Custom Files -#}
{% set custom_css = load_data(path='sass/custom.scss', required=false) -%}
{% if custom_css -%}
<link rel="stylesheet" href="{{/* get_url(path='custom.css') */}}" />
{% endif -%}
{% set custom_js = load_data(path='static/custom.js', required=false) -%}
{% if custom_js -%}
<script src="{{/* get_url(path='custom.js') */}}"></script>
{% endif -%}
HEREDOC
```

To test the latest changes, we'll create a couple of posts, one for each language. Let's start by creating the English version.

```bash
cat << HEREDOC > content/2008-08-03_tuning_zola.en.md
+++
title = "[EN] Tuning Zola"
date = 2008-08-03
[taxonomies]
tags = ['Education']
categories = ['Technology']
contexts = ['Social Media']
+++

# Emojis Aliases to Unicode Emojis

Here are a few common emoji aliases:

- \`:heart:\`
- \`:mate:\`
- \`:smile:\`

You can use these aliases in your posts to display emojis automatically. For example: I :heart: :mate: :smile:.

---

# Fibonacci Functions

Below are different implementations of the Fibonacci sequence in various programming languages:

### Rust Version

\`\`\`rust
fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        n
    } else {
        fibonacci(n - 1) + fibonacci(n - 2)
    }
}
\`\`\`

### JavaScript Version

\`\`\`javascript
function fibonacci(n) {
    if (n <= 1) {
        return n;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
\`\`\`

### PHP Version

\`\`\`php
<?php
function fibonacci(\$n) {
    if (\$n <= 1) {
        return \$n;
    } else {
        return fibonacci(\$n - 1) + fibonacci(\$n - 2);
    }
}
\`\`\`
HEREDOC
```

Now, let's create the Spanish version.

```bash
cat << HEREDOC > content/2008-08-03_tuning_zola.es.md
+++
title = "[ES] Afinando Zola"
date = 2008-08-03
[taxonomies]
tags = ['Education']
categories = ['Technology']
contexts = ['Social Media']
+++

# Alias de Emoji a Emoji Unicode

Aquí hay algunos alias comunes de emojis:

- \`:heart:\`
- \`:mate:\`
- \`:smile:\`

Puedes usar estos alias en tus publicaciones para mostrar emojis automáticamente. Por ejemplo: Yo :heart: :mate: :smile:.

---

# Funciones de Fibonacci

A continuación, se muestran diferentes implementaciones de la secuencia de Fibonacci en varios lenguajes de programación:

### Versión en Rust

\`\`\`rust
fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        n
    } else {
        fibonacci(n - 1) + fibonacci(n - 2)
    }
}
\`\`\`

### Versión en JavaScript

\`\`\`javascript
function fibonacci(n) {
    if (n <= 1) {
        return n;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
\`\`\`

### Versión en PHP

\`\`\`php
<?php
function fibonacci(\$n) {
    if (\$n <= 1) {
        return \$n;
    } else {
        return fibonacci(\$n - 1) + fibonacci(\$n - 2);
    }
}
\`\`\`
HEREDOC
```


Pagination
----------

This section will be fairly short. The goal here is to limit the number of posts displayed on the homepage to 10, and if there are more posts, the site will show pagination links. We can set up [pagination](https://www.getzola.org/documentation/templates/pagination/) by defining the `paginate_by` variable in the **index** file.

```bash
cat << HEREDOC | tee content/_index.en.md content/_index.es.md
+++
paginate_by = 10
+++
HEREDOC
```

You'll notice that the content is paginated, but the links remain in English, even if you've selected the Spanish language. While we won't cover the translation of these links in this post, you should be able to handle this yourself with the knowledge we've gained so far.


Favicon
-------

Currently, the site doesn't display any [icon](https://en.wikipedia.org/wiki/Favicon) in the browser tab. It's a good idea to set an icon so the site can be visually identified among a list of other open tabs. To begin, create the directory where we'll store the icon file(s).

```bash
mkdir -p static/icons
```

I've used an icon created from the [hatching-chick](https://favicon.io/emoji-favicons/hatching-chick/) emoji. If you prefer a different icon, make sure to adjust the following steps accordingly.

Visit the icon link and download it using the `download` button. You'll receive a zip file, which in my case was named `favicon_io.zip`. Extract its contents into the directory we created earlier: `static/icons`.

These files are typically placed in the root directory of the site. However, since we extracted them into a different directory, we'll need to update the URLs in the `site.webmanifest` file.

```bash
sed -i -e 's#:"/#:"/icons/#g' static/icons/site.webmanifest
```

Next, set the links to the icons in the base template file.

```bash
ed templates/base.html << HEREDOC
74d
73a
        <link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
        <link rel="manifest" href="/icons/site.webmanifest">
.
wq
HEREDOC
```


Search Page
-----------

Since we're building a static site, we don't have the option to implement a server-side search engine. Therefore, if we want to have a search page, it must function on the client side.

Zola natively supports generating search index files for [Lunr.js](https://lunrjs.com/) and [Fuse.js](https://www.fusejs.io/). For simplicity, we'll use Fuse.js in this tutorial. While I considered using [Pagefind](https://pagefind.app/), it would require the use of another application, which exceeds the scope of this small tutorial.

First, update the configuration file to instruct Zola to generate the search index files in **JSON** format for Fuse, and ensure this is done for both languages.

```bash
ed config.toml << HEREDOC
11s/false/true/
25a

[search]

# Produce a JSON search index file for [fuse.js](https://www.fusejs.io/)
index_format = "fuse_json"
.
37a
build_search_index = true
.
48a
build_search_index = true
.
wq
HEREDOC
```

Now, create a block in the HTML `<head>` section of the base template that will allow us to define specific tags in any child template.

```bash
ed templates/base.html << HEREDOC
102a
        {% block html_head -%}{% endblock html_head -%}
.
wq
HEREDOC
```

Let's create a search template for the search page. We'll use the _section_ template as a base for this.

```bash
cp themes/no-style-please/templates/section.html templates/search.html
```

Remove all the HTML tags that won’t be used in the search template, and define the `html_head` block.

```bash
ed templates/search.html << HEREDOC
4,5d
9,25d
1a

{% block html_head %}
{% endblock html_head %}
.
wq
HEREDOC
```

As we did with the code highlighting libraries, install (download) [fuse.js@7.0.0](https://github.com/krisk/Fuse/releases/tag/v7.0.0).

```bash
mkdir -p static/lib/fuse.js && \
curl --location --output static/lib/fuse.js/fuse.min.js  'https://unpkg.com/fuse.js@7.0.0/dist/fuse.min.js'
```

Insert the HTML `<script>` tag to load the just downloaded `fuse.js` library.

```bash
ed templates/search.html << HEREDOC
3a
<script src="{{/* get_url(path='lib/fuse.js/fuse.min.js') */}}"></script>
.
wq
HEREDOC
```

To continue building our search page, we need to write some logic that will read the search term from an input field. Then, it will initialize the search engine with some custom options and the index file generated by Zola, rendering the search results in the HTML document. The following logic is a modified version of the [`search.js`](https://github.com/getzola/zola/blob/master/docs/static/search.js) file from the Zola documentation site.

```bash
cat << HEREDOC > static/search.js
// This code has been copied and adapted from
// https://github.com/getzola/zola/blob/master/docs/static/search.js

// Function to limit the frequency of function calls,
// preventing excessive triggering
function debounce(func, delay) {
    let timeout;

    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);

        timeout = setTimeout(function () {
            func.apply(context, args);
        }, delay);
    };
}

// Initializes the search functionality
function initializeSearch() {
    // Input field for search terms
    const searchInput = document.getElementById("search");
    // Container for search result items
    const searchResultsContainer = document.getElementById("search-results");
    // Limit the number of results to display
    const MAX_RESULTS = 10;

    // Search options for Fuse.js
    const searchOptions = {
        // Sensitivity: lower values make the search more strict
        threshold: 0.2,
        // Ignore location in search (doesn't consider position of matching words)
        ignoreLocation: true,
        // Fields to search in each item
        keys: ["title", "body"]
    };

    // Stores the last search term to prevent redundant searches
    let currentSearchTerm = "";
    // Will hold the search index once loaded
    let searchIndex;

    // Loads the search index from a JSON file
    const loadSearchIndex = async function () {
        if (!searchIndex) {
            searchIndex = fetch(\`/search_index.\${LANGUAGE}.json\`)
                .then(async function(response) {
                    return await response.json();
                });
        }
        const indexData = await searchIndex;
        return indexData;
    };

    // Event listener for the search input field to trigger search on user input
    searchInput.addEventListener("keyup", debounce(async function() {
        // Trim any unnecessary whitespace
        const searchTerm = searchInput.value.trim();

        // Skip if the search term is the same as the previous one
        if (searchTerm === currentSearchTerm) {
            return;
        }

        // Clear previous results
        searchResultsContainer.innerHTML = "";
        currentSearchTerm = searchTerm;

        // Skip search if the input is empty
        if (searchTerm === "") {
            return;
        }

        // Load the search index and initialize Fuse.js with it
        const searchIndexData = await loadSearchIndex();
        const fuse = new Fuse(searchIndexData, searchOptions);

        // Perform the search using the current search term
        const searchResults = fuse.search(searchTerm);

        // If no results, do nothing
        if (searchResults.length === 0) {
            return;
        }

        // Display the search results (limit to MAX_RESULTS)
        for (let i = 0; i < Math.min(searchResults.length, MAX_RESULTS); i++) {
            const resultItem = searchResults[i].item;
            const resultElement = document.createElement("li");
            resultElement.innerHTML = \`<a href="\${resultItem.url}">\${resultItem.title}</a>\`;
            searchResultsContainer.appendChild(resultElement);
        }
    }, 150)); // 150ms delay to prevent excessive calls
}

// Initialize the search functionality once the page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
});
HEREDOC
```

Update the search template to load the custom logic file, set the language variable to load the appropriate index file, and configure the search UI elements: an input field for search and the `ul` tag where the search results will be listed.

```bash
ed templates/search.html << HEREDOC
4a
<script src="{{/* get_url(path='search.js') */}}"></script>
<script>const LANGUAGE = '{{ lang }}';</script>
.
13a
<input type="text" id="search" placeholder="text to search" />
<ul id="search-results"></ul>
.
wq
HEREDOC
```

The main work is done, but we won't see anything yet. We still need to create the search section/page for both languages.

```bash
mkdir -p content/search
cat << HEREDOC > content/search/_index.en.md
+++
title = "Search Page"
template = "search.html"
+++
HEREDOC
cat << HEREDOC > content/search/_index.es.md
+++
title = "Página de Búsqueda"
template = "search.html"
+++
HEREDOC
```

Create a link to the search page in the main menu.

```bash
ed config.toml << HEREDOC
68a
    { name = "*search", url = "/search" },
.
wq
HEREDOC
```

And apply a small update in the styles to make the search input cover 100% of the width.

```bash
cat << HEREDOC > sass/custom.scss
#search {
    width: 100%;
}
HEREDOC
```


Footer Greetings
----------------

To conclude this post, we'll display a greeting in the footer of the site. First, update the base template to import a footer partial.

```bash
ed templates/base.html << HEREDOC
120a
                {% include "partials/footer.html" ignore missing -%}
.
wq
HEREDOC
```

Now, create the partial with the footer greetings.

```bash
cat << HEREDOC > templates/partials/footer.html
{% set data = load_data(path="config.toml") -%}
<hr/>
<p class="foot-note">
Made with {{ ':heart:' | markdown(inline=true) }} by {{ data["author"] | default(value="pepe") }},
using {{ '[Zola](https://www.getzola.org/)' | markdown(inline=true) | safe }}
and {{ '[no-style-please](https://www.getzola.org/themes/no-style-please/)' | markdown(inline=true) | safe }}
</p>
HEREDOC
```

Finally, update the styles to decrease the font size of the footer greeting.

```bash
ed sass/custom.scss << HEREDOC
3a

.foot-note {
    font-size: 0.8em;
    text-align: center;
}
.
wq
HEREDOC
```


Wrapping Up
-----------

We've covered various topics that will give you a good idea of how to fine-tune a static site generated with Zola. I believe we don't need to make any more updates to this demo site for now. Let's wrap things up for today, and we'll continue in the next post, where we'll explore how to deploy the static site on [GitHub Pages](https://pages.github.com/).

Take care and until next time!
