{% set is_image = false -%}
{% if path is matching(".*\.(png|jpg|jpeg)$") -%}
{% set is_image = true -%}
{% endif %}
{% if is_image %}!{% endif %}[{{ name }}]({{ get_url(path=path) }})
