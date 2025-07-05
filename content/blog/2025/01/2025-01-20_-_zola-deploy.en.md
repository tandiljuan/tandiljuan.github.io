+++
title = "Zola Deploy"
date = 2025-01-20T21:43:04-03:00
[taxonomies]
tags = ['Zola', 'CI/CD', 'GitHub Actions', 'GitHub Pages']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>This post belongs to a series of posts related to the Zola static site engine.</summary>

1. [Zola Kickoff](@/blog/2025/01/2025-01-04_-_zola-kickoff.en.md)
2. [Zola Multilingual Site](@/blog/2025/01/2025-01-07_-_zola-multilingual-site.en.md)
3. [Zola Tuning](@/blog/2025/01/2025-01-13_-_zola-tuning.en.md)
4. Zola Deploy

</details>

We have reached the final step of our brief overview of how to build a simple static site with Zola. The next steps aren't strictly necessary if you only want to build the site, but they are essential if you plan to publish it online. There are many options for publishing a site, but since we're working with a static site, here's a list of services that specialize in this:

* [GitHub Pages](https://pages.github.com/)
* [Codeberg Pages](https://codeberg.page/)
* [GitLab Pages](https://docs.gitlab.com/ee/user/project/pages/)
* [Neocities](https://neocities.org/)
* [Cloudflare Pages](https://pages.cloudflare.com/)

Since I'm already using _GitHub_ to store the site's repository, I've chosen **GitHub Pages** as the simplest option. This guide will walk you through hosting our static site on _GitHub Pages_ using its [CI/CD](https://en.wikipedia.org/wiki/CI%2FCD) features, but feel free to choose any host that best fits your needs. We'll cover just the basics, but if you want to explore further, you can check out the [GitHub Pages](https://docs.github.com/en/pages) and [GitHub Actions](https://docs.github.com/en/actions) documentation.


Create and Set Up the Repository
--------------------------------

If you haven't done so already, let's start by creating the repository on _GitHub_. You need to be logged in, then click the **New repository** link from the dropdown menu at the top of the page.

{{ internal_link(name="Menu to Create Repository", path="assets/images/2025-01-20/zola-deploy_01.png") }}

Once you're on the new repository form, fill in the required fields (only the name is mandatory) and click the _Create repository_ button.

{{ internal_link(name="Form to Create Repository", path="assets/images/2025-01-20/zola-deploy_02.png") }}

You'll be redirected to the repository page, where you'll find instructions for uploading your local repository to _GitHub_. Next, click the **Settings** link, located at the far right of the repository's header menu.

{{ internal_link(name="Project Settings", path="assets/images/2025-01-20/zola-deploy_03.png") }}

On the repository's settings page, go to the **Pages** section. Here, change the source from which _GitHub Pages_ will take the content and publish it. Instead of the default "_Deploy from a branch_", select "**GitHub Actions**".

{{ internal_link(name="GitHub Pages Settings", path="assets/images/2025-01-20/zola-deploy_04.png") }}


GitHub Actions Workflow
-----------------------

Now that we've set up the repository, enabled _GitHub Pages_, and configured it to deploy content via _GitHub Actions_, it's time to create a workflow to build and deploy the site. We'll use [Hugo's example workflow](https://github.com/actions/starter-workflows/blob/main/pages/hugo.yml) and modify it to suit our needs.

Let's start by creating the directory where the workflow will reside.

```bash
mkdir -p .github/workflows
```

Now, create the workflow file that contains all the steps to build the site with Zola and deploy it to _GitHub Pages_. In this example, the file is named `zola-demo.yml`, but feel free to use any other name, as long as it ends with the `.yml` or `.yaml` extension.

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

As soon as you push this file to the repository on GitHub, _GitHub Actions_ will begin to run. To monitor its progress, click the "**Actions**" link located at the center of the repository's header menu, and you'll be able to see the status of the current workflow.

**IMPORTANT**: The workflow we've set up will be triggered on any **push** event. However, the default _GitHub Pages_ settings only allow deployment from the **main** branch. Therefore, unless you change this setting, the workflow will run for pushes made to the **main** branch and will fail for pushes made to any other branch.

{{ internal_link(name="Project Actions", path="assets/images/2025-01-20/zola-deploy_05.png") }}


Tweak the Site
--------------

We've hardcoded some links to be relative to the root of the domain. For example, the URL in the link to the English section is `/en/`, which means that if your domain is `https://www.dummy.com`, the link will go to `https://www.dummy.com/en/`.

If you plan to deploy the site using the domain as the base URL, everything will work just as it did in your local development environment. However, if you plan to deploy the site in a sub-path under your domain (for example, `https://www.dummy.com/zola/`), the link will break. It will still point to the wrong URL (`https://www.dummy.com/en/`) instead of the correct one (`https://www.dummy.com/zola/en/`).

Since I'm building the site from this tutorial series in a GitHub repository, and I'll be deploying it to a user domain sub-path (`http(s)://<username>.github.io/<repository>`), I need to fix the broken links to make sure they work in the sub-path context.

Let's start by updating the links in the header menu.

```bash
sed templates/macros/navigation.html -i -e 's/i\.1/get_url(path=i.1)/'
```

Continue by updating the links to the language sections on the homepage.

```bash
ed content/_index.md << HEREDOC
9,10s#/\([a-z]\+\)/#@/_index.\1.md#g
wq
HEREDOC
```

Next, update the links to the site's icons (favicons). Just like with the language links, these should be adjusted to work correctly when the site is deployed under a sub-path.

```bash
sed templates/base.html -i -e 's#href="/\([0-9a-zA-Z./-]\+\)"#href="{{ get_url(path="/\1", trailing_slash=false) | safe }}"#g'
```

Now, let's update the icon sources to make them relative to the [manifest file](https://developer.mozilla.org/en-US/docs/Web/Manifest/icons). The manifest file helps configure how icons are displayed when users add your site to their home screen on mobile devices or in other contexts.

```bash
sed static/icons/site.webmanifest -i -e 's#/icons/##g'
```

Next, update the taxonomy links in the content footer. These links typically point to specific categories or tags in the site.

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

The last update is for the search page. To ensure that the search functionality works correctly when the site is deployed in a sub-path, we're going to define a `BASE_URL` constant that will be used in the search UI logic. This will enable the search page to dynamically adjust its base URL based on the deployment context.

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

Finally, update the search UI logic to load the search index file using the `BASE_URL` constant.

```bash
ed static/search.js << HEREDOC
47s#\`/#\`\${BASE_URL}/#g
wq
HEREDOC
```


Zola Container
--------------

By now, the site should be working whether the base URL is the domain or a sub-path. However, the workflow will still be triggered by any branch push. Let's update it so that the workflow only runs on pushes to the main branch of the repository. Additionally, we will use the same app that we're using locally to build the static site. Instead of manually installing Zola, we'll reuse the same container image that we use in our development environment.

Here are the updates we need to make to the workflow file.

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


Wrapping Up
-----------

With this post, we conclude our overview of Zola. We've covered how to create a site, make it multilingual, adjust it, and finally, deploy it. While I've met my goal and we've reached a point where we can use what we've learned to start publishing online, there are many other aspects that weren't covered in this series of posts.

Now, it's up to you! You already have the foundation to start building your site. If you're looking for some extra motivation... [Can you publish 100 posts on your blog in a year?](https://100daystooffload.com/) :wink:

Take care and until next time!
