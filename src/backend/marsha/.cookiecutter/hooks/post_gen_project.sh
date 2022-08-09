#!/usr/bin/env bash

chown -R 1000:1000 .

echo -e "\n\e[34mDon't forget to configure Marsha settings to activate {{ cookiecutter.app_name }} app:\e[0m"
cat << EOF

src/backend/marsha/settings.py
    INSTALLED_APPS = [
        […]
+       "marsha.{{ cookiecutter.app_name }}.apps.{{ cookiecutter.app_name|capitalize }}Config",
    ]

+    # {{ cookiecutter.app_name }} application
+    {{ cookiecutter.setting_name }} = values.BooleanValue(False)


src/backend/marsha/urls.py
+    if settings.{{ cookiecutter.setting_name }}:
+        urlpatterns += [path("", include("marsha.{{ cookiecutter.app_name }}.urls"))]


src/backend/marsha/core/defaults.py
     # FLAGS
     […]
+    {{ cookiecutter.flag }} = "{{ cookiecutter.app_name }}"


src/backend/marsha/core/views.py
    from .defaults import {{ cookiecutter.flag }}

  In all convenient flags configurations:
     "flags": {
         […]
+        {{ cookiecutter.flag }}: settings.{{ cookiecutter.setting_name }},
     },


src/backend/marsha/development/views.py
+    from ..{{ cookiecutter.app_name }}.models import {{ cookiecutter.model }}

   In last_objects configuration:
     "last_objects": {
         […]
+         "{{ cookiecutter.model_url_part }}": {{ cookiecutter.model }}.objects.order_by("-updated_on")[:5],
     },


src/backend/marsha/core/templates/core/lti_development.html
     <select name="resource">
       […]
       <option value="{{ cookiecutter.model_url_part }}">{{ cookiecutter.model_short_description }}</option>
     </select>


You will then have to fix tests checking the 'context.get("flags")' items.

env.d/test, env.d/development.dist, env.d/development
+   # {{ cookiecutter.app_name }} application
+   DJANGO_{{ cookiecutter.setting_name }}=True
EOF

echo -e "\n\e[34mTo generate the initial migration once the model is ready:\e[0m"
echo -e "\e[36mdocker-compose exec app python manage.py makemigrations {{ cookiecutter.app_name }}\e[0m\n"
