+++
title = "Múltiples Idiomas con Zola"
date = 2025-01-07T14:32:08-03:00
[taxonomies]
categories = ['Blogging','Content Management','Static Site Generator','Web Development']
tags = ['Bash Script','Markdown','Multilingual','Zola']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>Esta publicación pertenece a una serie de publicaciones relacionadas con el motor de sitios estáticos Zola.</summary>

1. [Arrancando con Zola](@/blog/2025/01/2025-01-04_-_zola-kickoff.es.md)
2. Múltiples Idiomas con Zola
3. [Ajustando Zola](@/blog/2025/01/2025-01-13_-_zola-tuning.es.md)
4. [Despliegue de Zola](@/blog/2025/01/2025-01-20_-_zola-deploy.es.md)

</details>

Hoy vamos a describir cómo construir un sitio multidioma de una manera poco convencional. Esto significa que no se seguirá las instrucciones proporcionadas por la documentación al 100% y se creará una solución alternativa.

Supongo que todos saben que involucrarse con la Tecnología de la Información significa sumergirse en un mundo de documentación (publicaciones de blogs, manuales, libros, videos, etc.) en inglés. Debido a esto, me acostumbré a escribir en inglés, aunque soy consiente de mis limitaciones con el idioma. Pero recientemente, he necesitado dirigirme a una audiencia de habla hispana. Por eso tuve que configurar Zola para que sea un sitio multidioma.


Traducir Documento Existente
----------------------------

Lo primero que vamos a hacer es traducir el documento que ya tenemos al español. El nuevo archivo tendrá el mismo nombre que el de inglés, pero con la extensión `.es.md`, donde la parte `.es` es el código del idioma del contenido en el nuevo archivo.

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

Ahora, en la página principal del sitio, deberías ver dos elementos. Algo como lo siguiente:

* [1999-12-31T23:59:59Z - Document #01](http://localhost:3131/document-01/)
* [1999-12-31T23:59:59Z - Documento #01](http://localhost:3131/document-01-es/)


Corregir la Estructura de la URL Multidioma
-------------------------------------------

Si revisas el enlace del nuevo documento, notarás que tiene el código que agregamos en la extensión del archivo para determinar el idioma. La extensión `.es` se ha transformado en `-es` al final de la URL. Pero esto no es lo que buscamos en un sitio multidioma. El resultado deseado debería ser algo como `/es/document-01`, donde la primera parte de la ruta (`/es`) determina el idioma y todos los documentos relacionados con este idioma estarán ubicados aquí.

Para poder lograr esto, actualizaremos el archivo de configuración y definiremos el idioma **español**.

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

Después de la actualización, la página principal debería tener nuevamente solo un elemento, la publicación en inglés. La publicación en español debería estar ubicada en [`http://localhost:3131/es/`](http://localhost:3131/es/).

Por defecto, a los archivos sin un código de idioma en sus nombres de archivo, Zola los selecciona como si tuviesen el código del idioma principal. Por ejemplo, digamos que tenemos un sitio con el inglés como idioma predeterminado, y también hemos definido los idiomas portugués y español. Tenemos tres archivos: `post01.md`, `post01.pt.md` y `post01.es.md`. El archivo seleccionado para el idioma principal será el que no tenga un código de idioma en su nombre (en este ejemplo, `post01.md`). Si agregamos el código de idioma en el nombre del archivo, aparecerá en la URL, como vimos anteriormente, como `http://domain.com/post01-en`. También vale la pena mencionar que el idioma principal no tendrá su propia subsección en la URL (hay un [ticket abierto](https://github.com/getzola/zola/issues/1660)).

Estas limitaciones no son un problema si no estamos buscando tener un sitio multidioma o si no pensamos cambiar el idioma principal (de lo contrario, tendrás que renombrar todos los archivos). Pero si, como yo, no tienes la suerte de pertenecer a este grupo de creadores de contenido, necesitaremos buscar una solución alternativa. La que encontré para sortear estas limitaciones es no tener archivos bajo el idioma principal y definir todos los idiomas que vayamos a usar.

Comienza renombrando el archivo con la publicación en inglés y agregando el código de idioma en su nombre de archivo.

```bash
mv content/1999-12-31_document_01.md content/1999-12-31_document_01.en.md
```

Luego actualiza el archivo de configuración y define el idioma 'inglés', establece las variables para definir el nombre del blog, habilita la opción para generar los feeds y establece un [código no utilizado](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes#Table_of_all_possible_two-letter_codes) como el idioma predeterminado.

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

Ahora tenemos una sección para publicaciones en inglés en [`http://localhost:3131/en/`](http://localhost:3131/en/), otra para publicaciones en español en [`http://localhost:3131/es/`](http://localhost:3131/es/), y una [página de inicio](http://localhost:3131/) vacía.


Crear la Navegación Multidioma
------------------------------

El tema de Zola, que elegí en la publicación anterior, no soporta sitios multidiomas, así que también necesitaremos "hackearlo". Comienza copiando la plantilla base, desde el directorio del tema a nuestro directorio `templates`, para que pueda ser sobrescrito por nosotros.

```bash
cp themes/no-style-please/templates/base.html templates/
```

Ahora vamos a escribir algo de lógica en la plantilla para generar los enlaces de navegación multidiomas. Pero nos gustaría reutilizar la lógica para los enlaces de navegación tanto en el encabezado como en el pie de página. Para esto, vamos a usar un [macro](https://keats.github.io/tera/docs/#macros). Primero, crea el directorio donde va a estar ubicado el macro.

```bash
mkdir -p templates/macros
```

Luego, crea el macro que utilizaremos para construir los enlaces de navegación del encabezado y del pie de página.

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

Ahora es el momento de actualizar la plantilla base que copiamos anteriormente para que pueda hacer uso del macro que acabamos de crear.

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

En este punto, la lógica está en su lugar, pero aún no veremos nada. Es necesario actualizar el archivo de configuración y establecer la lista de enlaces que deberían aparecer en el menú de navegación del encabezado.

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

Este simple truco nos permite mostrar automáticamente los enlaces del encabezado que funcionaran correctamente en cada idioma. También agrega dos ~~bugs~~ características: la primera es un enlace especial llamado '[langs]' que convertirá la URL actual a los otros idiomas, y la segunda es la variable `def_lang`, que indica que el enlace debe mostrarse bajo el idioma predeterminado (`false` por defecto).


Corregir Enlaces de Taxonomía
-----------------------------

Los enlaces a **etiquetas**, **categorías** y **contextos** devolverán un código 404 (no encontrado). Esto se debe a que no hemos definido ninguna taxonomía. Vamos a solucionar esto con la siguiente actualización en nuestro archivo de configuración y definir estas [taxonomías](https://www.getzola.org/documentation/content/taxonomies/) para los idiomas inglés y español.

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

Luego necesitamos actualizar ambas publicaciones, la que está en inglés y la que está en español, y establecer algunas taxonomías para ellas.

```bash
echo '4a
[taxonomies]
tags=["Technology","Photography","Education"]
categories=["Technology","Art"]
contexts=["Social Media","Educational Settings"]
.
wq' | tee >(ed content/1999-12-31_document_01.en.md) >(ed content/1999-12-31_document_01.es.md)
```

Ahora verás que los enlaces de **etiquetas**, **categorías** y **contextos** en el menú de navegación han comenzado a funcionar. Sin embargo, los enlaces de taxonomía que aparecen al final de cada documento no funcionan. Como se mencionó en un párrafo anterior, esto se debe a la falta de soporte multidioma en el tema de Zola que he elegido.

Por lo tanto, para solucionar este problema utilizando un truco similar, necesitamos sobrescribir la plantilla `page.html`. Primero, copia el archivo del tema a nuestro directorio `templates`.

```bash
cp themes/no-style-please/templates/page.html templates/
```

Luego actualiza la platilla para mostrar correctamente las etiquetas bajo un idioma que no sea el predeterminado.

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

Después de la actualización anterior, todos los enlaces de taxonomía al final de las publicaciones deberían estar funcionando correctamente y apuntando a la sección en el idioma correcto.


Feed Web
--------

El enlace que apunta al canal de noticias (web feed), ubicada en la sección `<head>` de la plantilla base, también necesita ser actualizada para mostrar un enlace que funcione en todos los idiomas.

```bash
ed templates/base.html << HEREDOC
92s/false/false, lang=lang/
wq
HEREDOC
```


Página de Bienvenida
--------------------

Por ahora, no creo que necesitemos hacer ningún otro cambio para tener un sitio multidioma funcional. Lo único pendiente que se me ocurre es la falta de una página de bienvenida más amigable, en lugar de una página en blanco. Creemos una simple página de bienvenida para el sitio, permitiendo a los visitantes elegir entre los idiomas inglés y español.

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


Publicaciones de Prueba
-----------------------

Si querés tener una mejor idea de cómo funciona y se comporta el sitio, podemos crear un montón de publicaciones de prueba. A continuación, se muestra un script de bash que automatiza este proceso repetitivo y utiliza la API REST de [lorem-markdownum](https://github.com/jaspervdj/lorem-markdownum) para generar contenido.

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

Suponiendo que el script anterior está en un archivo llamado `dummy.sh`, podemos usar la CLI de Bash para llamar al script desde el directorio raíz de nuestro sitio para crear las publicaciones de prueba. Un comando como `bash dummy.sh 10 content/` creará 10 publicaciones con contenido de prueba en ambos idiomas. También podríamos llamarlo como `./dummy.sh 10 content/` si hemos establecido el permiso de ejecución para el archivo (`chmod a+x dummy.sh`).


Finalizando
-----------

Creo que hemos cubierto los puntos principales para construir un sitio multidioma con Zola. Siéntete libre de consultar [la documentación de Zola](https://www.getzola.org/documentation/getting-started/overview/) y la [documentación del tema](https://www.getzola.org/themes/no-style-please/) para hacer más cambios en el sitio hasta que te sientas cómodo.

¡Saludos y hasta la próxima!
