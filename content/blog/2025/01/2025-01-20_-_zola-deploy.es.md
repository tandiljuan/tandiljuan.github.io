+++
title = "Despliegue de Zola"
date = 2025-01-20T21:43:04-03:00
[taxonomies]
tags = ['Zola', 'CI/CD', 'GitHub Actions', 'GitHub Pages']
series = ['Zola Step by Step']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>Esta publicación pertenece a una serie de publicaciones relacionadas con el motor de sitios estáticos Zola.</summary>

1. [Arrancando con Zola](@/blog/2025/01/2025-01-04_-_zola-kickoff.es.md)
2. [Múltiples Idiomas con Zola](@/blog/2025/01/2025-01-07_-_zola-multilingual-site.es.md)
3. [Ajustando Zola](@/blog/2025/01/2025-01-13_-_zola-tuning.es.md)
4. Despliegue de Zola

</details>

Hemos llegado al último capitulo de nuestra breve serie de tutoriales donde construimos un simple sitio estático con Zola. Los siguientes pasos no son estrictamente necesarios si solo quieres construir el sitio, pero son esenciales si planeas publicarlo en Internet. Hay muchas opciones para publicar un sitio, pero dado que estamos trabajando con un sitio estático, aquí hay una lista de servicios que se especializan en esto:

* [GitHub Pages](https://pages.github.com/)
* [Codeberg Pages](https://codeberg.page/)
* [GitLab Pages](https://docs.gitlab.com/ee/user/project/pages/)
* [Neocities](https://neocities.org/)
* [Cloudflare Pages](https://pages.cloudflare.com/)

Dado que ya estoy usando _GitHub_ para almacenar el repositorio del sitio, he elegido **GitHub Pages** como la opción más simple. Esta guía te llevará a través de la publicación de nuestro sitio estático en _GitHub Pages_ utilizando sus características de [CI/CD](https://en.wikipedia.org/wiki/CI%2FCD), pero siéntete libre de elegir cualquier host que se ajuste mejor a tus necesidades. Cubriremos solo lo básico, pero si quieres explorar más, puedes consultar la documentación de [GitHub Pages](https://docs.github.com/en/pages) y [GitHub Actions](https://docs.github.com/en/actions).


Crea y Configura el Repositorio
-------------------------------

Si aún no lo has hecho, comencemos creando el repositorio en _GitHub_. Necesitas estar logueado, luego haz clic en el enlace **Nuevo repositorio** en el menú desplegable en la parte superior de la página.

{{ internal_link(name="Menú para Crear un Repositorio", path="assets/20250120-zola-deploy/zola-deploy_01.png") }}

Una vez que estés en el formulario del nuevo repositorio, completa los campos requeridos (solo el nombre es obligatorio) y haz clic en el botón _Crear repositorio_.

{{ internal_link(name="Formulario para Crear un Repositorio", path="assets/20250120-zola-deploy/zola-deploy_02.png") }}

Serás redirigido a la página del repositorio, donde encontrarás instrucciones para subir tu repositorio local a _GitHub_. A continuación, haz clic en el enlace **Configuración**, ubicado en el extremo derecho del menú de encabezado del repositorio.

{{ internal_link(name="Configuraciones del Proyecto", path="assets/20250120-zola-deploy/zola-deploy_03.png") }}

En la página de configuración del repositorio, ve a la sección **Pages**. Aquí, cambia la fuente de la que _GitHub Pages_ tomará el contenido y lo publicará. En lugar de la opción predeterminada "_Desplegar desde una rama_", selecciona "**GitHub Actions**".

{{ internal_link(name="Configuraciones de GitHub Pages", path="assets/20250120-zola-deploy/zola-deploy_04.png") }}


Flujo de Trabajo de GitHub Actions
----------------------------------

Ahora que hemos creado el repositorio, habilitado _GitHub Pages_ y lo hemos configurado para desplegar contenido a través de _GitHub Actions_, es hora de crear un flujo de trabajo para construir y desplegar el sitio. Usaremos [el flujo de trabajo de ejemplo de Hugo](https://github.com/actions/starter-workflows/blob/main/pages/hugo.yml) y lo modificaremos para adaptarlo a nuestras necesidades.

Comencemos creando el directorio donde residirá el flujo de trabajo.

```bash
mkdir -p .github/workflows
```

Ahora, crea el archivo de flujo de trabajo que contenga todos los pasos para construir el sitio con Zola y desplegarlo en _GitHub Pages_. En este ejemplo, el archivo se llama `zola-demo.yml`, pero siéntete libre de usar cualquier otro nombre, siempre que termine con la extensión `.yml` o `.yaml`.

```bash
cat << HEREDOC > .github/workflows/zola-demo.yml
# This workflow has been copied and modified from the Hugo starter workflow:
# https://github.com/actions/starter-workflows/blob/main/pages/hugo.yml
#
# For more information about this file, refer to the documentation page:
# https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions

name: Deploy Zola to Pages

# Controls when the workflow will run.
on: [push]

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Create a map of default settings that will apply to all jobs in the workflow
# and provide bash as the default shell.
defaults:
  run:
    shell: bash

# Allow only one concurrent deployment, skipping runs queued between the run
# in-progress and latest queued. However, do NOT cancel in-progress runs as we
# want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

# A workflow run is made up of one or more \`jobs\`, which run in parallel by
# default. To run jobs sequentially, you can define dependencies on other jobs
# using \`needs\` keyword.
jobs:

  # ---------
  # Build Job
  build:

    # Define the type of machine to run the job on
    runs-on: ubuntu-latest

    # Variables that are available to the steps of all jobs in the workflow
    env:
      ZOLA_VERSION: 0.19.2

    # A job contains a sequence of tasks called steps. Not all steps run
    # actions, but all actions run as a step.
    steps:

      # https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#adding-a-system-path
      - name: Install Zola CLI
        run: |
          mkdir -p \${{ runner.temp }}/zola \\
          && wget -O \${{ runner.temp }}/zola/zola.tar.gz "https://github.com/getzola/zola/releases/download/v\${ZOLA_VERSION}/zola-v\${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \\
          && tar --directory \${{ runner.temp }}/zola -xzf \${{ runner.temp }}/zola/zola.tar.gz \\
          && echo "\${{ runner.temp }}/zola" >> "\$GITHUB_PATH"

      # https://github.com/marketplace/actions/checkout
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive

      # https://github.com/marketplace/actions/configure-github-pages
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: Build with Zola
        run: |
          zola build \\
            --base-url "\${{ steps.pages.outputs.base_url }}/" \\
            --force

      # https://github.com/marketplace/actions/upload-github-pages-artifact
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  # --------------
  # Deployment Job
  deploy:

    # Jobs that must complete successfully before this job will run
    needs: build

    # Define the type of machine to run the job on
    runs-on: ubuntu-latest

    # Define the environment that the job references
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}

    # A job contains a sequence of tasks called steps. Not all steps run
    # actions, but all actions run as a step.
    steps:

      # https://github.com/marketplace/actions/deploy-github-pages-site
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
HEREDOC
```

Tan pronto como subas este archivo al repositorio en GitHub, _GitHub Actions_ comenzará a ejecutarse. Para monitorear su progreso, haz clic en el enlace "**Actions**" ubicado en el centro del menú de encabezado del repositorio, y podrás ver el estado del flujo de trabajo actual.

**IMPORTANTE**: El flujo de trabajo que hemos configurado se activará en cualquier evento de **push**. Sin embargo, la configuración predeterminada de _GitHub Pages_ solo permite el despliegue desde la rama **main**. Por lo tanto, a menos que cambies esta configuración, el flujo de trabajo se ejecutará correctamente en los pushes realizados sobre la rama **main** y fallará con los pushes realizados en cualquier otra rama.

{{ internal_link(name="Project Actions", path="assets/20250120-zola-deploy/zola-deploy_05.png") }}


Ajusta el Sitio
---------------

Hemos codificado algunos enlaces para que sean relativos a la raíz del dominio. Por ejemplo, la URL en el enlace a la sección en inglés es `/en/`, lo que significa que si tu dominio es `https://www.dummy.com`, el enlace irá a `https://www.dummy.com/en/`.

Si planeas desplegar el sitio utilizando el dominio como la base de la URL, todo funcionará igual que en tu entorno de desarrollo local. Sin embargo, si planeas desplegar el sitio dentro de una subruta bajo tu dominio (por ejemplo, `https://www.dummy.com/zola/`), el enlace se romperá. Seguirá apuntando a la URL incorrecta (`https://www.dummy.com/en/`) en lugar de la correcta (`https://www.dummy.com/zola/en/`).

Dado que el sitio de éstos tutoriales lo estoy construyendo en un repositorio de GitHub y lo desplegaré en una subruta del dominio de usuario (`http(s)://<username>.github.io/<repository>`), necesito corregir los enlaces rotos para asegurarme de que funcionen en el contexto de la subruta.

Comencemos actualizando los enlaces en el menú de encabezado.

```bash
sed templates/macros/navigation.html -i -e 's/i\.1/get_url(path=i.1)/'
```

Continúa actualizando los enlaces a las secciones de idioma en la página de inicio.

```bash
ed content/_index.md << HEREDOC
9,10s#/\([a-z]\+\)/#@/_index.\1.md#g
wq
HEREDOC
```

A continuación, actualiza los enlaces a los íconos del sitio (favicons). Al igual que con los enlaces de idioma, estos deben ajustarse para funcionar correctamente cuando el sitio se despliegue bajo una subruta.

```bash
sed templates/base.html -i -e 's#href="/\([0-9a-zA-Z./-]\+\)"#href="{{ get_url(path="/\1", trailing_slash=false) | safe }}"#g'
```

Ahora, actualicemos las fuentes de los íconos para que sean relativas al [archivo de manifiesto](https://developer.mozilla.org/en-US/docs/Web/Manifest/icons). El archivo de manifiesto ayuda a configurar cómo se muestran los íconos cuando los usuarios añaden tu sitio a su pantalla de inicio en dispositivos móviles o en otros contextos.

```bash
sed static/icons/site.webmanifest -i -e 's#/icons/##g'
```

A continuación, actualiza los enlaces a las taxonomías en el pie de página del contenido. Estos enlaces suelen apuntar a categorías o etiquetas específicas en el sitio.

```bash
ed templates/page.html << HEREDOC
42d
41a
{% set path = [path_lang, "tags", tag | slugify] | join(sep="/") -%}
<a href="{{ get_url(path=path) | safe }}">#{{ tag }}</a>
.
47d
46a
{% set path = [path_lang, "categories", category | slugify] | join(sep="/") -%}
<a href="{{ get_url(path=path) | safe }}">+{{ category }}</a>
.
53d
52a
{% set path = [path_lang, "contexts", context | slugify] | join(sep="/") -%}
<a href="{{ get_url(path=path) | safe }}">@{{ context }}</a>
.
wq
HEREDOC
```

La última actualización es para la página de búsqueda. Para asegurar que la funcionalidad de búsqueda funcione correctamente cuando el sitio se despliega en una subruta, vamos a definir una constante `BASE_URL` que se utilizará en la lógica de la interfaz de usuario de búsqueda. Esto permitirá que la página de búsqueda ajuste dinámicamente la base de la URL según el contexto de despliegue.

```bash
ed templates/search.html << HEREDOC
6d
5a
<script>
    const BASE_URL = '{{/* get_url(path='/', trailing_slash=false) */}}';
    const LANGUAGE = '{{ lang }}';
</script>
.
wq
HEREDOC
```

Finalmente, actualiza la lógica de la interfaz de búsqueda para cargar el índice de búsqueda utilizando la constante `BASE_URL`.

```bash
ed static/search.js << HEREDOC
47s#\`/#\`\${BASE_URL}/#g
wq
HEREDOC
```


Contenedor de Zola
------------------

En este momento, el sitio debería estar funcionando tanto si la URL base es el dominio como si es una subruta. Sin embargo, el flujo de trabajo aún se activará con un push a cualquier rama. Actualicemos el archivo para que el flujo de trabajo solo se ejecute con los pushes a la rama principal del repositorio. Además, utilizaremos la misma aplicación que estamos usando localmente para construir el sitio estático. En lugar de instalar Zola manualmente, reutilizaremos la misma imagen de contenedor que usamos en nuestro entorno de desarrollo.

Aquí están las actualizaciones que necesitamos hacer en el archivo del flujo de trabajo.

```bash
ed .github/workflows/zola-demo.yml << HEREDOC
7a

# GitHub displays the workflow run name in the list of workflow runs on your
# repository's "Actions" tab.
run-name: "> \${{ github.event_name }} '\${{ github.ref_name }}' \${{ github.ref_type }} by @\${{ github.triggering_actor }}"
.
14d
13a
# Triggers the workflow on push event but only for the "main" branch
on:
  push:
    branches: [ "main" ]
.
49,52d
53,60d
64,69d
63a

      # https://github.com/marketplace/actions/docker-run-action
      - name: Build with Zola
        uses: addnab/docker-run-action@v3
        with:
          image: tandiljuan/zola:0.19.2
          options: --volume \${{ github.workspace }}:/app
          run: |
            zola build \\
              --base-url "\${{ steps.pages.outputs.base_url }}/" \\
              --force
.
wq
HEREDOC
```


Finalizando
-----------

Con este artículo concluimos nuestra descripción general de Zola. Hemos cubierto cómo crear un sitio, hacerlo multidioma, ajustarlo y, finalmente, desplegarlo. Aunque he cumplido mi objetivo y hemos llegado a un punto donde podemos usar lo que hemos aprendido para comenzar a publicar en Internet, hay muchos otros aspectos que no se trataron en esta breve serie de publicaciones.

¡Ahora depende de ti! Ya tienes la base para comenzar a construir tu sitio. Si estás buscando un poco de motivación extra... [¿Puedes publicar 100 publicaciones en tu blog en un año?](https://100daystooffload.com/) :wink:

¡Saludos y hasta la próxima!
