"""Utils for working with lti_select modules."""

from functools import cache

import django
from django.utils.module_loading import import_string


@cache
def get_lti_select_resources():
    """Look for all available lti select resources."""

    result = []
    for app in django.apps.apps.app_configs.values():
        if not app.name.startswith("marsha."):
            continue

        try:
            lti_select_config = import_string(
                f"{app.name}.lti_select.get_lti_select_config"
            )
            if config := lti_select_config():
                result.append(config)
        except ImportError:
            pass

    # Flatten result list
    flatten_result = [item for sublist in result for item in sublist]

    return {config["name"]: config for config in flatten_result}
