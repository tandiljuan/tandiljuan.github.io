+++
title = "Zola Multilingual Site"
date = 2025-01-07T14:32:08-03:00
[taxonomies]
tags = ['Zola', 'Static Site Generator', 'i18n', 'Templates']
series = ['Zola Step by Step']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>This post belongs to a series of posts related to the Zola static site engine.</summary>

1. [Zola Kickoff](@/blog/2025/01/2025-01-04_-_zola-kickoff.en.md)
2. Zola Multilingual Site
3. [Zola Tuning](@/blog/2025/01/2025-01-13_-_zola-tuning.en.md)
4. [Zola Deploy](@/blog/2025/01/2025-01-20_-_zola-deploy.en.md)

</details>

Here, we're going to describe how to build a multilingual site in a hacky way. This means that it won't follow the instructions provided by the documentation 100% and will create an alternative solution.

I guess that everybody knows that getting involved with Information Technology means diving into a world of documentation (blog posts, manuals, books, videos, etc.) in English. Because of this, and knowing my limitations with the language, I got used to writing in English. But recently, I needed to target a Spanish-speaking audience. This is why I had to configure Zola to be a multilingual site.


Translate Existing Document
---------------------------

The first thing we're going to do is translate the document we already have in place into Spanish. The new document file will have the same name as the English one, but with the extension `.es.md`, where the `.es` part is the language code of the content in the new document file.

```bash
cat << HEREDOC > content/1999-12-31_document_01.es.md
+++
# https://www.getzola.org/documentation/content/page/#front-matter
title = "Documento #01"
date = 1999-12-31T23:59:59Z
+++

# H1: Título Principal

Markdown[^1] es un método fácil de usar para dar formato al texto y que se vea bien en cualquier dispositivo. Se enfoca en lo básico, sin agregar características complejas como tamaño de fuente, color o estilo. Aquí hay algunos ejemplos: \`código en línea\`, _palabras en cursiva_, **palabras en negrita**, [enlace al repositorio de Zola](https://github.com/getzola/zola) y ~~tachado~~.

## H2: Algo de Código (HTML)

    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>título</title>
      </head>
      <body>
        <!-- contenido de la página -->
      </body>
    </html>

## H2: Una Lista Desordenada

* Sed ut perspiciatis unde omnis iste[^2].
* Natus error sit voluptatem accusantium.
* Doloremque laudantium, totam rem aperiam.

## H2: Un Ejemplo de Tabla

| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Valor #1  | Valor #2  | Valor #3  |

## H2: Sección de Imagen

A continuación se obtiene una imagen de [Lorem Picsum](https://github.com/DMarby/picsum-photos).

![Cachorrito](https://picsum.photos/id/237/300/200)

[^1]: Consulta [CommonMark](https://commonmark.org/) para más información.
[^2]: Esta es la segunda nota al pie.
HEREDOC
```

Now, on the main page of the site, you should see two items. Something like the following:

* [1999-12-31T23:59:59Z - Document #01](http://localhost:3131/document-01/)
* [1999-12-31T23:59:59Z - Documento #01](http://localhost:3131/document-01-es/)


Fix Multilingual URL Structure
------------------------------

If you check the link of the new document, you'll notice that it has the code we added in the file extension to determine the language. The extension `.es` has been transformed into `-es` at the end of the URL. But this is not what we're looking for in a multilingual site. The desired result should be something like `/es/document-01`, where the first part of the path (`/es`) determines the language and all documents related to this language will be located here.

To achieve this goal, update the configuration file and define the **Spanish** language.

```bash
ed config.toml << HEREDOC
17i

# Additional languages definition

## Spanish
[languages.es]
.
wq
HEREDOC
```

After the update, the main page should have only one item again, the English post. The Spanish post should be located under [`http://localhost:3131/es/`](http://localhost:3131/es/).

By default, Zola picks the files without a language code in their file names as the main language files. For example, let's say we have a site with English as the default language, and we have also defined the languages Portuguese and Spanish. We have three files: `post01.md`, `post01.pt.md`, and `post01.es.md`. The file picked for the main language will be the one without a language code in its name (in this example, `post01.md`). If we add the language code in the file name, it will appear in the URL, as we previously saw, like `http://domain.com/post01-en`. It's also worth noting that the main language won't have its own sub-section in the URL (there is an [open ticket](https://github.com/getzola/zola/issues/1660)).

These limitations aren't an issue if we aren't looking to have a multilingual site or if you won't be changing the main language (otherwise, you'll have to rename all files). But if you aren't so lucky to belong to this group of content creators, like me, we'll need to look for a workaround. The one I found to bypass these limitations is to not have files under the main language and to define all the languages we're going to use.

Start by renaming the file with the post in English and adding the language code in its file name.

```bash
mv content/1999-12-31_document_01.md content/1999-12-31_document_01.en.md
```

Continue updating the configuration file and define the 'English' language, set the variables to define the blog name, enable the flag to generate the feeds, and set an [unused code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes#Table_of_all_possible_two-letter_codes) as the default language.

```bash
ed config.toml << HEREDOC
22i
title = "Blog de Demostración"
generate_feeds = true
.
19i

## English
[languages.en]
title = "Demo Blog"
generate_feeds = true
.
12i

# Set an unused code as the default language
default_language = "xx"
.
wq
HEREDOC
```

Now we have a section for English posts at [`http://localhost:3131/en/`](http://localhost:3131/en/), another for Spanish posts at [`http://localhost:3131/es/`](http://localhost:3131/es/), and an empty [home page](http://localhost:3131/).


Create Multilingual Navigation
------------------------------

The theme, which I chose in the previous post, doesn't support multilingual sites, so we will also need to "hack" it. Start by copying the theme's base template file to our `templates` directory so it can be overwritten by us.

```bash
cp themes/no-style-please/templates/base.html templates/
```

Now we're going to write some template logic to generate the multilingual navigation links. But we would like to reuse the logic for the navigation links in both the header and the footer. For this, we're going to use a [macro](https://keats.github.io/tera/docs/#macros). First, create the directory where the macro is going to live.

```bash
mkdir -p templates/macros
```

Then create the macro that we'll use to build the header and footer navigation links.

```bash
cat << HEREDOC > templates/macros/navigation.html
{% macro element(list) -%}
<nav>
    {% set nav_links = [] -%}
    {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
    {# ## Iterate items from list in configuration file -#}
    {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
    {% for nav_item in list %}
        {% set link_name = nav_item.name -%}
        {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
        {# ## Process the "special" name '[langs]' -#}
        {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
        {% if "[langs]" == link_name and config.languages | length > 0 -%}
            {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
            {# ## Iterate through the languages in the config file -#}
            {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
            {% for code, value in config.languages -%}
                {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
                {# ## Skip if default or current language -#}
                {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
                {% if config.default_language == code or lang == code -%}
                    {% continue -%}
                {% endif -%}
                {% if config.default_language == lang -%}
                    {% set path = current_path | default(value="/") -%}
                    {% set link_url = "/" ~ code ~ path -%}
                {% else -%}
                    {% set link_url = current_url | regex_replace(pattern=get_url(path="/"), rep='') -%}
                    {% set link_url = link_url | replace(from='/' ~ lang ~ '/', to='/' ~ code ~ '/') -%}
                {% endif -%}
                {% set link_values = [code, link_url, false] -%}
                {% set_global nav_links = nav_links | concat(with=[link_values]) -%}
            {% endfor -%}
        {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
        {# ## Process normal link from list -#}
        {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
        {% else -%}
            {% if config.default_language == lang and not nav_item.def_lang | default(value=false) -%}
                {% continue -%}
            {% endif -%}
            {% set link_url = nav_item.url -%}
            {% if config.default_language != lang and link_url is starting_with("/") -%}
                {% set link_url = "/" ~ lang ~ link_url -%}
            {% endif -%}
            {% set new_tab = nav_item.new_tab | default(value=false) -%}
            {% set link_values = [link_name, link_url, new_tab] -%}
            {% set_global nav_links = nav_links | concat(with=[link_values]) -%}
        {% endif -%}
    {% endfor %}
    {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
    {# ## Build list of links -#}
    {# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -#}
    {% for i in nav_links -%}
        <a href="{{ i.1 | safe }}"{% if i.2 %} target="_blank" rel="noreferrer noopener"{% endif %}>{{ i.0 }}</a>
    {% endfor -%}
</nav>
{% endmacro element -%}
HEREDOC
```

Now it's time to update the base template that we previously copied so it can make use of the macro we just created.

```bash
ed templates/base.html << HEREDOC
116,120d
116i
                    {{ navigation::element(list=config.extra.footer_nav) }}
.
102,106d
102i
                    {{ navigation::element(list=config.extra.header_nav) }}
.
1i
{% import "macros/navigation.html" as navigation %}
.
wq
HEREDOC
```

At this point, the logic is in place, but we won't see anything yet. It's necessary to update the configuration file and set the list of links that should appear in the header navigation menu.

```bash
ed config.toml << HEREDOC
37a

# Header navigation links
header_nav = [
    { name = "~home", url = "/", def_lang=true },
    { name = "#tags", url = "/tags" },
    { name = "+categories", url = "/categories" },
    { name = "@contexts", url = "/contexts" },
    { name = "[langs]" },
]
.
wq
HEREDOC
```

This simple workaround allows us to automatically display header links that properly work in each language section. It also adds two ~~bugs~~ features: the first one is a special link named '[langs]' that will convert the current URL to the other languages, and the second one is the variable `def_lang`, which indicates that the link must be displayed under the default language (`false` by default).


Fix Taxonomy Links
------------------

The links to **tags**, **categories**, and **contexts** will return a 404 (not found) code. This is because we haven't defined any taxonomy. Let's fix this with the following update in our configuration file and define these [taxonomies](https://www.getzola.org/documentation/content/taxonomies/) for the English and Spanish languages.

```bash
ed config.toml << HEREDOC
31a
taxonomies = [
    { name = "tags" },
    { name = "categories" },
    { name = "contexts" },
]
.
32,36t26
wq
HEREDOC
```

Then we need to update both posts, the English and Spanish ones, and set some taxonomies for them.

```bash
echo '4a
[taxonomies]
tags=["Technology","Photography","Education"]
categories=["Technology","Art"]
contexts=["Social Media","Educational Settings"]
.
wq' | tee >(ed content/1999-12-31_document_01.en.md) >(ed content/1999-12-31_document_01.es.md)
```

Now you'll see that the **tags**, **categories**, and **contexts** links in the header navigation menu started to work. However, the taxonomy links that appear at the bottom of each document don't work. As mentioned in a previous paragraph, this is due to the lack of multilingual support in the theme I chose.

Therefore, to fix this issue using a similar workaround, we need to overwrite the template's `page.html` file. First, copy the file from the theme to our `templates` directory.

```bash
cp themes/no-style-please/templates/page.html templates/
```

Then update it to properly display the tags under a non-default language.

```bash
ed templates/page.html << HEREDOC
38,47s/"\//"{{ path_lang | safe }}\/
34a
{%- set path_lang = "" -%}
{%- if config.default_language != lang -%}
    {%- set path_lang = "/" ~ lang -%}
{%- endif -%}
.
wq
HEREDOC
```

After the previous update, all the taxonomy links at the bottom of the posts should be working fine and pointing to the correct language section.


Web Feed
--------

The tag that points to the feed file, located in the head section, also needs to be updated to display a working link in all languages.

```bash
ed templates/base.html << HEREDOC
92s/false/false, lang=lang/
wq
HEREDOC
```


Landing Page
------------

So far, I don't think we need to make any other changes to have a working multilingual site. The only pending thing that comes to my mind is the lack of a landing page with a friendlier welcome, other than an empty blank page. Let's create a simple site's landing page, allowing visitors to choose between English and Spanish.

```bash
cat << HEREDOC > content/_index.md
+++
+++

Zola Demo Site
==============

Welcome to this [Zola](https://www.getzola.org/)-powered multilingual demo site! To proceed, please select your preferred language from the available options. This will ensure that the content is displayed in the language you're most comfortable with. Thank you for visiting, and enjoy the experience!

* [English](/en/)
* [Spanish](/es/)
HEREDOC
```


Dummy Posts
-----------

That's it. However, if you want to get a better idea of how the site works and behaves, we can create a bunch of dummy posts. Below is a bash script that automates this repetitive process and uses the [lorem-markdownum](https://github.com/jaspervdj/lorem-markdownum) REST API.

```bash
#!/usr/bin/env bash

# #############################################################################
# Create Dummy Content
# ====================
#
# This function generates dummy blog posts with random content, tags,
# categories and contexts. It fetches text from the Lorem Markdownum API,
# creates posts in English and Spanish, and saves them as Markdown files in the
# specified directory. A delay is included between API requests to prevent
# overloading the service.
#
# ## Parameters:
#
# 1. AMOUNT_OF_POSTS (optional): The number of posts to create (default: 1).
# 2. POSTS_PATH (optional): The directory where the posts will be saved (default: current directory).
# #############################################################################
function create_dummy_content {
    # Parameters and default values
    AMOUNT_OF_POSTS="${1:-1}"
    POSTS_PATH="${2:-.}"

    # URL for the Lorem Markdownum API
    LOREM_MARKDOWNUM='https://jaspervdj.be/lorem-markdownum/markdown.txt?underline-headers=on&fenced-code-blocks=on&num-blocks=10'

    # Lists for tags, categories and contexts
    LIST_TAG=("Technology" "Photography" "Health" "Travel" "Education")
    LIST_CATEGORY=("Technology" "Entertainment" "Business" "Science" "Art")
    LIST_CONTEXT=("Work Environment" "Social Media" "Educational Settings" "Political Discussions" "Scientific Research")

    # Create the specified number of posts
    for i in $(seq 1 $AMOUNT_OF_POSTS); do
        # Generate a random date within a 10-year range starting from 2000
        DATE=$(date '+%Y-%m-%d' -d "2000-01-01 +$(( RANDOM % 3653 )) days")
        MARKDOWN=$(curl --silent --location "${LOREM_MARKDOWNUM}")
        TITLE=$(echo "${MARKDOWN}" | head -n1)
        TITLE_FILE_NAME=$(echo "${TITLE}" | sed -e 's/[^a-zA-Z0-9 ]//g' | tr '[:upper:]' '[:lower:]' | xargs | sed -e 's/\s/_/g')

        # Randomly select tags
        TAX_TAG=()
        for j in $(seq 0 4 | shuf | head -n$(shuf -i 1-3 -n 1)); do
            TAX_TAG=("${TAX_TAG[@]}" "'${LIST_TAG[j]}'")
        done
        TAX_TAG=$(IFS=, ; echo "${TAX_TAG[*]}")

        # Randomly select categories
        TAX_CAT=()
        for j in $(seq 0 4 | shuf | head -n$(shuf -i 1-3 -n 1)); do
            TAX_CAT=("${TAX_CAT[@]}" "'${LIST_CATEGORY[j]}'")
        done
        TAX_CAT=$(IFS=, ; echo "${TAX_CAT[*]}")

        # Randomly select contexts
        TAX_CON=()
        for j in $(seq 0 4 | shuf | head -n$(shuf -i 1-3 -n 1)); do
            TAX_CON=("${TAX_CON[@]}" "'${LIST_CONTEXT[j]}'")
        done
        TAX_CON=$(IFS=, ; echo "${TAX_CON[*]}")

        # Create the dummy posts for English and Spanish
        for k in 'en' 'es'; do
            cat << HEREDOC > "${POSTS_PATH}/${DATE}_${TITLE_FILE_NAME}.${k}.md"
+++
title = "[$( echo "${k}" | tr '[:lower:]' '[:upper:]')] ${TITLE}"
date = ${DATE}
[taxonomies]
tags=[${TAX_TAG}]
categories=[${TAX_CAT}]
contexts=[${TAX_CON}]
+++

$(echo "${MARKDOWN}" | tail -n+4)
HEREDOC
        done

        echo "Created the files '${POSTS_PATH}/${DATE}_${TITLE_FILE_NAME}.*.md'"

        # Wait 3 seconds to avoid overloading the lorem-markdownum API
        if (( i < $AMOUNT_OF_POSTS )); then
            for l in {1..3}; do
                if (( 1 == l )); then echo -n 'Wait 3 seconds '; fi
                sleep 1
                echo -n '.'
                if (( 3 == l )); then echo; fi
            done
        fi
    done
}

create_dummy_content $1 $2
```

Assuming that the previous script is in a file called `dummy.sh`, we can use the Bash CLI to call the script from the root directory of our site to create the dummy posts. A command like `bash dummy.sh 10 content/` will create 10 posts with dummy content in both languages. We could also call it like `./dummy.sh 10 content/` if we have set the execution permission for the file (`chmod a+x dummy.sh`).


Wrapping Up
-----------

I think we have covered the main points to build a multilingual site with Zola. Feel free to check [Zola's documentation](https://www.getzola.org/documentation/getting-started/overview/) and the [theme's documentation](https://www.getzola.org/themes/no-style-please/) to make more changes in the site until you feel comfortable.

Take care and until next time!
