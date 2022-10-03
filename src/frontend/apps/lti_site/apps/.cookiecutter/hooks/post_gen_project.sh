#!/usr/bin/env bash

chown -R 1000:1000 .

echo -e "\n\e[34mDon't forget to configure {{ cookiecutter.app_name }} in core:\e[0m"
cat << EOF

src/frontend/apps/lti_site/types/AppData.ts
    export enum appNames {
      […]
+     {{ cookiecutter.flag }} = '{{ cookiecutter.app_name }}',
      […]
    }

    export enum flags {
      […]
+     {{ cookiecutter.flag }} = '{{ cookiecutter.app_name }}',
      […]
    }

src/frontend/apps/lti_site/data/appConfigs.ts
    export const appConfigs: { [key in appNames]?: { flag?: flags } } = {
      […]
+     [appNames.{{ cookiecutter.flag }}]: { flag: flags.{{ cookiecutter.flag }} },
      […]
    };

EOF
