{#- ----------------------------- IMPORT MACROS ---------------------------- -#}
{%- import 'macros/link.html' as link -%}
{#- --------------------------------- **** --------------------------------- -#}
{#- # Short-Code: `internal_link`                                            -#}
{#-                                                                          -#}
{#- This shortcode generates Markdown syntax for internal links. It detects  -#}
{#- if the target path points to an image and adjusts the syntax as a        -#}
{#- result.                                                                  -#}
{#-                                                                          -#}
{#- @param {string} name - The link text.                                    -#}
{#- @param {string} path - The link's path. If the path starts with `@/`, it -#}
{#- will be treated as an internal link to a Markdown file, relative to the  -#}
{#- `content` directory and validated.                                       -#}
{#- --------------------------------- **** --------------------------------- -#}
{{- link::internal(name=name, path=path) | safe -}}
