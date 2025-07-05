+++
title = "Arrancando con Zola"
date = 2025-01-04T15:51:26-03:00
[taxonomies]
tags = ['Zola', 'Static Site Generator', 'Tutorial']
series = ['Zola Step by Step']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>Esta publicación pertenece a una serie de publicaciones relacionadas con el motor de sitios estáticos Zola.</summary>

1. Arrancando con Zola
2. [Múltiples Idiomas con Zola](@/blog/2025/01/2025-01-07_-_zola-multilingual-site.es.md)
3. [Ajustando Zola](@/blog/2025/01/2025-01-13_-_zola-tuning.es.md)
4. [Despliegue de Zola](@/blog/2025/01/2025-01-20_-_zola-deploy.es.md)

</details>

Tengo muchos documentos y notas dispersos en mi sistema de archivos, además de una instancia local de [TiddlyWiki](https://tiddlywiki.com/). Seguramente seguirán apareciendo más, y por eso sentí la necesidad de empezar a bloguear. En el pasado solía posponer la revisión de todo esto, y quedarme solamente con lo que necesito o considero útil. Bueno, parece que llegó el momento, y esta publicación es el primer paso.

Antes que nada, necesito decidir cómo y dónde voy a almacenar toda esta documentación. Conozco la existencia de [GitHub Pages](https://pages.github.com/), y como estoy bastante acostumbrado a escribir archivos en [Markdown](https://commonmark.org/), me gusta la idea de generar un sitio estático a partir de Markdown con una herramienta como [Jekyll](https://github.com/jekyll/jekyll). Así que, tras investigar un poco, elegí [Zola](https://github.com/getzola/zola) como el [Generador de Sitios Estáticos](https://jamstack.org/generators/) que voy a utilizar. Puntos extra por ser una aplicación binaria y por utilizar [Tera](https://github.com/Keats/tera) como motor de plantillas.

Otra cosa que he estado posponiendo es actualizar mi viejo [Ubuntu OS](https://ubuntu.com/) (estoy usando 16.04 Xenial Xerus) porque... bueno... funciona bien, no tenía urgencia de actualizar, y el período de soporte fue extendido. Pero debo empezar a pensar en esto seriamente, porque no queda mucho tiempo hasta que finalice el soporte. Dicho esto, leí las [instrucciones de instalación](https://www.getzola.org/documentation/getting-started/installation/) de Zola para usar su imagen de Docker, pero no funcionaron para mí (probablemente por mi viejo sistema operativo). Así que terminé creando una imagen de Docker, que subí a [Docker Hub](https://hub.docker.com/r/tandiljuan/zola).

Este artículo proporciona instrucciones para iniciar un sitio sencillo construido con Zola ([versión 0.19.2](https://github.com/getzola/zola/pkgs/container/zola/versions)). Intenté ser lo más determinista posible, asegurando que cualquier persona pueda lograr el mismo resultado, sin importar el sistema operativo. Las herramientas principales que usé son [Docker](https://en.wikipedia.org/wiki/Docker_%28software%29) (una alternativa podría ser [Podman](https://en.wikipedia.org/wiki/Podman)) para ejecutar Zola, y varias aplicaciones de [línea de comandos](https://en.wikipedia.org/wiki/Command-line_interface) que pueden ser reemplazadas fácilmente por otras herramientas.

El resultado final, tras seguir las instrucciones de todas las publicaciones de esta serie, debería parecerse a este [Sitio Demo de Zola](https://tandiljuan.github.io/zola-demo/). Además, [aquí](https://github.com/tandiljuan/zola-demo) se encuentra el repositorio con el código fuente del proyecto.


Configurar Zola
---------------

El primer paso es crear un par de alias en el archivo `~/.bashrc` para ejecutar Zola. El siguiente alias ejecuta Zola, compartiendo el directorio de trabajo actual dentro del contenedor.

```bash
alias zola='docker run -ti --rm -u "$(id -u):$(id -g)" -v "${PWD}:/app" tandiljuan/zola:0.19.2'
```

El siguiente alias ejecuta el servidor de Zola (modo de desarrollo) para que podamos controlar los resultados en un navegador.

```bash
alias zola-serve='docker run -ti --rm -u "$(id -u):$(id -g)" -v "${PWD}:/app" -p 3131:3131 -p 1024:1024 tandiljuan/zola:0.19.2 serve --interface 0.0.0.0 --port 3131 --base-url localhost'
```

A partir de ahora asumiré que los alias funcionan correctamente. Por ejemplo, si ejecutamos el comando `zola --version`, deberíamos ver como salida `zola 0.19.2`.


Arrancando con el Sitio
-----------------------

Lo primero que vamos a hacer, es crear el directorio donde estará el sitio y nos movemos dentro de él:

```bash
mkdir zola-demo && \
cd zola-demo
```

Usando el comando `zola`, creamos un nuevo proyecto y dejamos las opciones por defecto, que luego podremos cambiar. En mi caso, ya había inicializado un repositorio de [git](https://en.wikipedia.org/wiki/Git), así que el directorio no estaba vacío y tuve que usar la opción `--force` de Zola.

```bash
# La opción `--force` no es necesaria si el directorio está vacío.
zola init --force
```

Usando el comando `tree` (`tree --charset=ascii -F --dirsfirst -n`) para listar la estructura del directorio, deberíamos ver algo como esto:

```
.
|-- content/
|-- sass/
|-- static/
|-- templates/
|-- themes/
`-- config.toml

5 directories, 1 files
```


Servidor de (Desarrollo) Zola
-----------------------------

Usando el siguiente comando, que se basa en el alias definido anteriormente, inicia el [servidor](https://www.getzola.org/documentation/getting-started/cli-usage/#serve) de Zola.

```bash
zola-serve --drafts
```

Una vez que el servidor esté corriendo, abrimos el navegador y vamos a [`http://localhost:3131`](http://localhost:3131). Allí deberíamos ver algo como lo que muestra esta imagen:

{{ internal_link(name="Nuevo Sitio Zola", path="assets/images/2025-01-04/zola-kickoff_01.png") }}

La imagen anterior confirma que Zola funciona correctamente. También nos indica que tenemos dos opciones: [instalar un tema](https://www.getzola.org/documentation/themes/installing-and-using-themes/) o crear un archivo [`index.html`](https://www.getzola.org/documentation/templates/overview/). Vamos por la opción más simple: instalar un tema.


Configurar un Tema
------------------

Voy a explicar tres formas para instalar un tema. El tema que he elegido es [**no-style-please**](https://www.getzola.org/themes/no-style-please/), versión/hash [`30dd31fb`](https://gitlab.com/atgumx/no-style-please/-/tree/30dd31fbc558597110f373b3ef1e0c75ea350f75).

La primera opción para instalar el tema es descargarlo como un archivo comprimido desde el servidor del repositorio.

```bash
curl -L -o themes/download.tar.bz2 'https://gitlab.com/atgumx/no-style-please/-/archive/30dd31fbc558597110f373b3ef1e0c75ea350f75/no-style-please-30dd31fbc558597110f373b3ef1e0c75ea350f75.tar.bz2' && \
tar -C themes/ -xjf themes/download.tar.bz2 && \
rm themes/download.tar.bz2 && \
mv themes/no-style-please-30dd31fbc558597110f373b3ef1e0c75ea350f75 themes/no-style-please
```

La segunda opción es usar **git** para clonar el repositorio del tema.

```bash
git clone https://gitlab.com/atgumx/no-style-please.git themes/no-style-please && \
(cd themes/no-style-please && git reset --hard 30dd31fbc558597110f373b3ef1e0c75ea350f75)
```

La tercera opción es usar **submodule** de git, si el sitio que estamos creando ya está siendo trackeado en un repositorio de git. Esta opción es la mejor elección cuando ya estamos usando git y no haremos ningún cambio en los archivos del tema.

```bash
git submodule add https://gitlab.com/atgumx/no-style-please.git themes/no-style-please && \
(cd themes/no-style-please && git reset --hard 30dd31fbc558597110f373b3ef1e0c75ea350f75)
```

Una vez que hayamos instalado el tema (descargándolo en la carpeta `themes`), es hora de habilitarlo con la actualización del archivo `config.toml` (usando [ed](https://en.wikipedia.org/wiki/Ed_%28software%29)), donde definiremos la variable `theme`.

```bash
ed config.toml << HEREDOC
9i

# Theme name
theme = "no-style-please"
.
wq
HEREDOC
```


Primer Contenido
----------------

Mientras estamos en modo de desarrollo (`zola serve`), Zola estará atento a cualquier cambio realizado en los archivos y se recargará [automágicamente](https://en.wikipedia.org/wiki/Magic_%28programming%29) para mostrar las actualizaciones en el sitio. En este punto, deberíamos ver una página en blanco.

Vamos a crear la primer publicación para que se muestre en el sitio. A continuación hay un ejemplo ilustrativo, pero eres libre de poner lo que quieras.

```bash
cat << HEREDOC > content/1999-12-31_document_01.md
+++
# https://www.getzola.org/documentation/content/page/#front-matter
title = "Document #01"
date = 1999-12-31T23:59:59Z
+++

# H1: Main Title

Markdown[^1] is an easy-to-use method for formatting text that displays well on any device. It focuses on the basics, without adding complex features like font size, color, or style. Here are some examples: \`inline code\`, _italic words_, **bold words**, [link to Zola repo](https://github.com/getzola/zola), and ~~strikethrough~~.

## H2: Some Code (HTML)

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>title</title>
      </head>
      <body>
        <!-- page content -->
      </body>
    </html>

## H2: Unordered List

* Sed ut perspiciatis unde omnis iste[^2].
* Natus error sit voluptatem accusantium.
* Doloremque laudantium, totam rem aperiam.

## H2: Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value #1 | Value #2 | Value #3 |

## H2: Image Section

Get an image from [Lorem Picsum](https://github.com/DMarby/picsum-photos).

![Puppy](https://picsum.photos/id/237/300/200)

[^1]: Check the [CommonMark](https://commonmark.org/).
[^2]: This is the second footnote.
HEREDOC
```

Si revisás el navegador, notarás que el sitio sigue vacío. Esto se debe a que el tema elegido requiere una variable *extra* para mostrar contenido en la página principal:

```bash
cat << HEREDOC >> config.toml

# Enable listing of pages in homepage
list_pages = true
HEREDOC
```

¡Voilà! Ahora deberíamos ver un enlace en la página de inicio que apunta a nuestro documento. El enlace debería verse similar a [`1999-12-31T23:59:59Z - Document #01`](http://localhost:3131/document-01/).


Finalizando
-----------

En este punto me siento lo suficientemente cómodo como para dar por concluida esta publicación, donde iniciamos un sitio con Zola.

¡Saludos y hasta la próxima!
