+++
title = "Ajustando Zola"
date = 2025-01-13T20:49:16-03:00
[taxonomies]
tags = ['Zola', 'Static Site Generator', 'Performance', 'SEO']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>Esta publicación pertenece a una serie de publicaciones relacionadas con el motor de sitios estáticos Zola.</summary>

1. [Arrancando con Zola](@/blog/2025/01/2025-01-04_-_zola-kickoff.es.md)
2. [Múltiples Idiomas con Zola](@/blog/2025/01/2025-01-07_-_zola-multilingual-site.es.md)
3. Ajustando Zola
4. [Despliegue de Zola](@/blog/2025/01/2025-01-20_-_zola-deploy.es.md)

</details>

En artículos anteriores, hemos creado un sitio estático usando Zola y lo hemos hecho multidioma. Si bien esto puede servir como una introducción básica, creo que podemos hacer algunos ajustes para mejorar el sitio. En esta publicación, configuraremos algunas opciones, mostraremos emojis, instalaremos bibliotecas externas y crearemos una página de búsqueda, entre otros ajustes.


Nombre del Autor
----------------

Si has revisado los feeds, es posible que hayas notado que falta el nombre del autor. Comencemos estableciendo la variable `author` para resolver este problema.

```bash
ed config.toml << HEREDOC
3i

# The default author for pages
author = "Juan Manuel Lopez"
.
wq
HEREDOC
```

Para hacer el sitio más accesible y fácil se navegar, agreguemos un enlace a los feeds en el menú principal.

```bash
ed config.toml << HEREDOC
57a
    { name = "!feed", url = "/atom.xml" },
.
wq
HEREDOC
```


Contenido en Markdown
---------------------

En el archivo de configuración, bajo la sección `[markdown]`, hay distintas variables que podemos establecer o modificar para controlar cómo se procesa el Markdown. Una de estas variables es `render_emoji`, que nos permite convertir alias de emojis en emojis Unicode. Puedes consultar la [emoji-cheat-sheet](https://github.com/ikatyang/emoji-cheat-sheet/) si no recuerdas los alias de emoji.

```bash
ed config.toml << HEREDOC
23i

# Translate emoji aliases to corresponding Unicode emoji equivalent
render_emoji = true
.
wq
HEREDOC
```

Zola ofrece otras variables para resaltar bloques de código, pero usarlas alteraría cómo se renderiza el código en el HTML. Específicamente, añadiría etiquetas para el resaltado de código, haciendo que el código HTML sea menos legible. Por lo tanto, prefiero usar una biblioteca de JavaScript para esta tarea, dejando los bloques `<code>` en HTML sin modificar. Para el resaltado de código, usaremos [Highlight.js](https://github.com/highlightjs/highlight.js), y para agregar un botón de **copiar al portapapeles**, usaremos [highlightjs-copy](https://github.com/arronhunt/highlightjs-copy).

En lugar de cargar estas bibliotecas desde la plantilla base, modularizaremos las plantillas colocándolas en un archivo de plantilla externo (parcial), que se incluirá en la plantilla base. Para hacer esto, comenzaremos con la instrucción de Tera para [incluir](https://keats.github.io/tera/docs/#include) un archivo de plantilla externo.

```bash
ed templates/base.html << HEREDOC
97a
        {% include "partials/head.html" ignore missing -%}
.
wq
HEREDOC
```

Ahora, instalemos (descarguemos) [highlight.js@11.9.0](https://github.com/highlightjs/highlight.js/releases/tag/11.9.0). He elegido descargar la biblioteca en lugar de apuntar al CDN para demostrar el proceso y asegurarme de que el sitio funcione localmente en un entorno sin conexión a Internet.

```bash
mkdir -p static/lib/highlight.js && \
curl --location --output static/lib/highlight.js/highlight.min.js 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js' && \
curl --location --output static/lib/highlight.js/highlight.min.css 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
```

A continuación, instalemos (descarguemos) [highlightjs-copy@1.0.6](https://github.com/arronhunt/highlightjs-copy/releases/tag/1.0.6).

```bash
mkdir -p static/lib/highlightjs-copy && \
curl --location --output static/lib/highlightjs-copy/highlightjs-copy.min.js 'https://unpkg.com/highlightjs-copy@1.0.6/dist/highlightjs-copy.min.js' && \
curl --location --output static/lib/highlightjs-copy/highlightjs-copy.min.css 'https://unpkg.com/highlightjs-copy@1.0.6/dist/highlightjs-copy.min.css'
```

Una vez que las bibliotecas estén instaladas, necesitamos inicializarlas y llamarlas una vez que la página esté cargada. Podemos hacer esto con el siguiente código.

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

Finalmente, crea la plantilla parcial `head.html`, que se inyectará en la sección `head` utilizando la instrucción que declaramos anteriormente. Este archivo es responsable de enlazar las bibliotecas, así como nuestro código y estilos personalizados.

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

Para probar los últimos cambios, crearemos un par de publicaciones, una para cada idioma. Comencemos creando la versión en inglés.

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

Ahora, creemos la versión en español.

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


Paginación
----------

Esta sección será bastante corta. El objetivo aquí es limitar el número de publicaciones mostradas en la página de inicio a 10, y si hay más publicaciones, el sitio mostrará enlaces de paginación. Podemos configurar la [paginación](https://www.getzola.org/documentation/templates/pagination/) definiendo la variable `paginate_by` en el archivo **index**.

```bash
cat << HEREDOC | tee content/_index.en.md content/_index.es.md
+++
paginate_by = 10
+++
HEREDOC
```

Notarás que el contenido está paginado, pero los enlaces permanecen en inglés, incluso si has seleccionado el idioma español. Si bien no cubriremos la traducción de estos enlaces en esta publicación, deberías poder manejar esto tú mismo con el conocimiento que hemos adquirido hasta ahora.


Favicon
-------

Actualmente, el sitio no muestra ningún [icono](https://en.wikipedia.org/wiki/Favicon) en la pestaña del navegador. Es una buena idea establecer un icono para que el sitio pueda ser identificado visualmente entre una lista de otras pestañas abiertas. Para comenzar, crea el directorio donde almacenaremos el(los) archivo(s) del icono.

```bash
mkdir -p static/icons
```

He utilizado un icono creado a partir del emoji de [pollito saliendo del cascarón](https://favicon.io/emoji-favicons/hatching-chick/). Si prefieres un icono diferente, asegúrate de ajustar los siguientes pasos.

Visita el enlace del icono y descárgalo usando el botón `download`. Recibirás un archivo zip, que en mi caso se llamó `favicon_io.zip`. Extrae su contenido en el directorio que creamos anteriormente: `static/icons`.

Estos archivos suelen colocarse en el directorio raíz del sitio. Sin embargo, dado que los extraímos en un directorio diferente, necesitaremos actualizar las URL en el archivo `site.webmanifest`.

```bash
sed -i -e 's#:"/#:"/icons/#g' static/icons/site.webmanifest
```

A continuación, establece los enlaces a los iconos en el archivo de plantilla base.

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


Página de Búsqueda
------------------

Dado que estamos construyendo un sitio estático, no tenemos la opción de implementar un motor de búsqueda del lado del servidor. Por lo tanto, si queremos tener una página de búsqueda, debe funcionar del lado del cliente (el navegador).

Zola soporta de forma nativa la generación de índices de búsqueda para [Lunr.js](https://lunrjs.com/) y [Fuse.js](https://www.fusejs.io/). Para simplificar, en este tutorial usaremos Fuse.js. Consideré usar [Pagefind](https://pagefind.app/), pero requeriría el uso de otra aplicación, lo que excede el alcance de este pequeño tutorial.

Primero, actualiza el archivo de configuración para decirle a Zola que genere los índices de búsqueda en formato **JSON** para Fuse, y controla que esto se haga para ambos idiomas.

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

Ahora, crea un bloque en la sección `<head>` del HTML de la plantilla base que nos permita definir etiquetas específicas en cualquier plantilla hija.

```bash
ed templates/base.html << HEREDOC
102a
        {% block html_head -%}{% endblock html_head -%}
.
wq
HEREDOC
```

Vamos a crear una plantilla para la página de búsqueda. Usaremos la plantilla _section_ como base para esto.

```bash
cp themes/no-style-please/templates/section.html templates/search.html
```

Elimina todas las etiquetas HTML que no se utilizarán en la plantilla de búsqueda y define el bloque `html_head`.

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

Como hicimos con las bibliotecas de resaltado de código, instalemos (descarguemos) [fuse.js@7.0.0](https://github.com/krisk/Fuse/releases/tag/v7.0.0).

```bash
mkdir -p static/lib/fuse.js && \
curl --location --output static/lib/fuse.js/fuse.min.js  'https://unpkg.com/fuse.js@7.0.0/dist/fuse.min.js'
```

Inserta la etiqueta HTML `<script>` para cargar la biblioteca `fuse.js` que acabas de descargar.

```bash
ed templates/search.html << HEREDOC
3a
<script src="{{/* get_url(path='lib/fuse.js/fuse.min.js') */}}"></script>
.
wq
HEREDOC
```

Para continuar construyendo nuestra página de búsqueda, necesitamos escribir algo de lógica que lea el término de búsqueda desde un campo de entrada. Luego, inicializará el motor de búsqueda con algunas opciones personalizadas y el archivo de índice generado por Zola, renderizando los resultados de búsqueda en el documento HTML. La siguiente lógica es una versión modificada del archivo [`search.js`](https://github.com/getzola/zola/blob/master/docs/static/search.js) del sitio de documentación de Zola.

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

Actualiza la plantilla de búsqueda para cargar el archivo con la lógica anterior, establece la variable de idioma para cargar el archivo de índices correspondiente y configura los elementos de la interfaz de usuario de la página de búsqueda: un campo de entrada de texto (para la búsqueda) y la etiqueta `ul` donde se enumerarán los resultados de búsqueda.

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

El trabajo principal está hecho, pero aún no veremos nada. Todavía necesitamos crear la sección/página de búsqueda para ambos idiomas.

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

En el menú principal, crea un enlace a la página de búsqueda.

```bash
ed config.toml << HEREDOC
68a
    { name = "*search", url = "/search" },
.
wq
HEREDOC
```

Y aplica una pequeña actualización en los estilos para que el campo de entrada de texto en la página de búsqueda cubra el 100% del ancho.

```bash
cat << HEREDOC > sass/custom.scss
#search {
    width: 100%;
}
HEREDOC
```


Saludos en el Pie de Página
---------------------------

Para concluir esta publicación, mostraremos un saludo en el pie de página del sitio. Primero, actualiza la plantilla base para importar una plantilla parcial.

```bash
ed templates/base.html << HEREDOC
120a
                {% include "partials/footer.html" ignore missing -%}
.
wq
HEREDOC
```

Ahora, crea el parcial con los saludos del pie de página.

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

Finalmente, actualiza los estilos para disminuir el tamaño de la fuente en pie de página.

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


Finalizando
-----------

Hemos cubierto varios temas que te darán una buena idea de cómo ajustar un sitio estático generado con Zola. Creo que no necesitamos hacer más actualizaciones a este sitio de demostración. Vamos a concluir por hoy, y continuaremos en la próxima publicación, donde exploraremos cómo desplegar el sitio estático en [GitHub Pages](https://pages.github.com/).

¡Saludos y hasta la próxima!
