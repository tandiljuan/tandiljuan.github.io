+++
title = "Zola Kickoff"
date = 2025-01-04T15:51:26-03:00
[taxonomies]
tags = ['Zola', 'Static Site Generator', 'Tutorial']
series = ['Zola Step by Step']
[extra]
add_toc = true
+++

<details class="auto-hide">

<summary>This post belongs to a series of posts related to the Zola static site engine.</summary>

1. Zola Kickoff
2. [Zola Multilingual Site](@/blog/2025/01/2025-01-07_-_zola-multilingual-site.en.md)
3. [Zola Tuning](@/blog/2025/01/2025-01-13_-_zola-tuning.en.md)
4. [Zola Deploy](@/blog/2025/01/2025-01-20_-_zola-deploy.en.md)

</details>

I have a bunch of documents and notes scattered throughout my file system, as well as a local [TiddlyWiki](https://tiddlywiki.com/) instance. I guess more will come, and because of this, I felt the need to start blogging. In the past, I've been putting off reviewing everything and keeping only what I need or think is useful. Well, it seems that the time has come, and this post is the first step.

Before anything, I need to choose how and where I'm going to store all this documentation. I know about the existence of [GitHub Pages](https://pages.github.com/), and because I'm quite used to writing [Markdown](https://commonmark.org/) files, I like the idea of generating a static site from Markdown with a tool like [Jekyll](https://github.com/jekyll/jekyll). So, after doing some research, I chose [Zola](https://github.com/getzola/zola) as the [Static Site Generator](https://jamstack.org/generators/) I'm going to use. Points for being a single binary application and for using [Tera](https://github.com/Keats/tera) as its template engine.

Another thing I've been putting off is updating my old [Ubuntu OS](https://ubuntu.com/) (I'm using 16.04 Xenial Xerus) because... well... it's working fine, I didn't have the urge to update, and the support time has been extended. I need to start thinking seriously about this because I don't have much time until the support ends. That being said, I read Zola's [installation instructions](https://www.getzola.org/documentation/getting-started/installation/) to run the Docker image, but it didn't work for me (probably because of my old OS). So, I had to create a Docker image, which I have uploaded to [Docker Hub](https://hub.docker.com/r/tandiljuan/zola).

This article provides instructions for bootstrapping a simple site built with Zola ([version 0.19.2](https://github.com/getzola/zola/pkgs/container/zola/versions)). I tried to be as deterministic as possible, ensuring that anyone can achieve the same result, regardless of the OS used. The main tools I used are [Docker](https://en.wikipedia.org/wiki/Docker_%28software%29) (an alternative could be [Podman](https://en.wikipedia.org/wiki/Podman)) to run Zola and several [CLI](https://en.wikipedia.org/wiki/Command-line_interface) apps that could easily be replaced by other tools.

The final result, after following the instructions in all the posts in this series, should resemble something like this [Zola Demo Site](https://tandiljuan.github.io/zola-demo/). Additionally, [here](https://github.com/tandiljuan/zola-demo) is the repository containing the source code for the project.


Set up Zola
-----------

The first step is to create a couple of aliases in the `~/.bashrc` file to run Zola. The following alias runs Zola, sharing the current working directory inside the container.

```bash
alias zola='docker run -ti --rm -u "$(id -u):$(id -g)" -v "${PWD}:/app" tandiljuan/zola:0.19.2'
```

The next alias runs Zola's server (development mode) so we can check the results in a browser.

```bash
alias zola-serve='docker run -ti --rm -u "$(id -u):$(id -g)" -v "${PWD}:/app" -p 3131:3131 -p 1024:1024 tandiljuan/zola:0.19.2 serve --interface 0.0.0.0 --port 3131 --base-url localhost'
```

From now on, I'll assume the previous aliases are working fine. For example, if we run the command `zola --version`, we should get the output `zola 0.19.2`.


Site Initialization
-------------------

Create the directory where the site will reside and move into it.

```bash
mkdir zola-demo && \
cd zola-demo
```

Using the `zola` command, create a new project and leave the default options, which we can change later. Before this step, I had initialized a [git](https://en.wikipedia.org/wiki/Git) repository, so the directory wasn't empty, and I had to use Zola's `--force` option.

```bash
# The `--force` option isn't needed if the directory is empty.
zola init --force
```

Using the `tree` command (`tree --charset=ascii -F --dirsfirst -n`) to list the directory structure, we should see something like this:

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


Zola's (Development) Server
---------------------------

Start Zola's [server](https://www.getzola.org/documentation/getting-started/cli-usage/#serve) using the following command, which is based on the alias defined previously.

```bash
zola-serve --drafts
```

Once the server is up and running, open your browser and go to [`http://localhost:3131`](http://localhost:3131). In the browser, you should see something like the following image.

{{ internal_link(name="Fresh Zola site", path="assets/20250104-zola-kickoff/zola-kickoff_01.png") }}

The previous image shows us that Zola is working correctly. It also tells us that we have two options: [install a theme](https://www.getzola.org/documentation/themes/installing-and-using-themes/) or create an [`index.html`](https://www.getzola.org/documentation/templates/overview/) file. Let's choose the easier option and install a theme.


Set up a Theme
--------------

I'm going to explain three options for installing a theme. The theme that I have chosen is [**no-style-please**](https://www.getzola.org/themes/no-style-please/), version/hash [`30dd31fb`](https://gitlab.com/atgumx/no-style-please/-/tree/30dd31fbc558597110f373b3ef1e0c75ea350f75).

The first option to install the theme is to download it as a compressed file from the repository server.

```bash
curl -L -o themes/download.tar.bz2 'https://gitlab.com/atgumx/no-style-please/-/archive/30dd31fbc558597110f373b3ef1e0c75ea350f75/no-style-please-30dd31fbc558597110f373b3ef1e0c75ea350f75.tar.bz2' && \
tar -C themes/ -xjf themes/download.tar.bz2 && \
rm themes/download.tar.bz2 && \
mv themes/no-style-please-30dd31fbc558597110f373b3ef1e0c75ea350f75 themes/no-style-please
```

The second option is to use **git** to clone the theme's repository.

```bash
git clone https://gitlab.com/atgumx/no-style-please.git themes/no-style-please && \
(cd themes/no-style-please && git reset --hard 30dd31fbc558597110f373b3ef1e0c75ea350f75)
```

The third option is to use git's **submodule** when the site we're creating is already being tracked in a git repository. This option is the best choice when we're already using git and won't be making any changes to the theme's files.

```bash
git submodule add https://gitlab.com/atgumx/no-style-please.git themes/no-style-please && \
(cd themes/no-style-please && git reset --hard 30dd31fbc558597110f373b3ef1e0c75ea350f75)
```

Once we've installed the theme (by downloading it into the `themes` folder), it's time to enable it by updating the `config.toml` file (using [ed](https://en.wikipedia.org/wiki/Ed_%28software%29)) and setting the `theme` variable.

```bash
ed config.toml << HEREDOC
9i

# Theme name
theme = "no-style-please"
.
wq
HEREDOC
```


First Content
-------------

While in development mode (`zola serve`), Zola will watch for any changes made to the files and [automagically](https://en.wikipedia.org/wiki/Magic_%28programming%29) reload to display the updates on the site. At this point, we should see an empty white page.

Let's create our first post to be displayed on the site. Below is a dummy example, but you are free to put anything you like.

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

If you check the browser, you'll notice that the site is still empty. That's because the theme we selected requires an _extra_ variable to display content on the main page.

```bash
cat << HEREDOC >> config.toml

# Enable listing of pages in homepage
list_pages = true
HEREDOC
```

Voilà! Now we should see a link on the home page pointing to our document. The link should look something like [`1999-12-31T23:59:59Z - Document #01`](http://localhost:3131/document-01/).


Wrapping Up
-----------

At this point, I'm comfortable enough to conclude this post, where we have bootstrapped a Zola site.

Take care and until next time!
