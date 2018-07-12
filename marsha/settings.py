"""Django settings for marsha project.

Uses django-configurations to manage environments inheritance and the loading of some
config from the environment

"""

import os

from django.utils.translation import gettext_lazy as _

from configurations import Configuration, values


class Base(Configuration):
    """Base configuration every configuration (aka environment) should inherit from.

    It depends on an environment variable that SHOULD be defined:
    - DJANGO_SECRET_KEY

    You may also want to override default configuration by setting the following
    environment variables:
    - DJANGO_DEBUG
    - DATABASE_URL
    """

    BASE_DIR = os.path.dirname(__file__)

    STATIC_URL = "/static/"

    SECRET_KEY = values.SecretValue()

    DEBUG = values.BooleanValue(False)

    DATABASES = values.DatabaseURLValue()

    ALLOWED_HOSTS = []

    # Application definition

    INSTALLED_APPS = [
        "django.contrib.admin.apps.SimpleAdminConfig",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        "django_extensions",
        "marsha.core.apps.CoreConfig",
        "marsha.lti_provider",
    ]
    PYLTI_CONFIG = {
        "consumers": {
          "key": {
             "secret": "secret"
          }
        }
    }
    BASE_LTI_PARAMS = {
      u'launch_presentation_return_url': u'/asset/',
      u'lis_person_contact_email_primary': u'foo@bar.com',
      u'lis_person_name_full': u'Foo Bar Baz',
      u'lis_result_sourcedid': u'course-v1%3AedX%2BDemoX%2BDemo_Course'
                             u':dns.fr-724d6c2b5fcc4a17a26b9120a1d463aa:student',
      u'lti_message_type': u'basic-lti-launch-request',
      u'lti_version': u'LTI-1p0',
      u'roles':
        u'urn:lti:instrole:ims/lis/Instructor,urn:lti:instrole:ims/lis/Staff',
      u'resource_link_id': u'dns.fr-724d6c2b5fcc4a17a26b9120a1d463aa',
      u'user_id': u'student',
    }




    AUTHENTICATION_BACKENDS = [
        'django.contrib.auth.backends.ModelBackend',
        'marsha.lti_provider.auth.LTIBackend',
    ]
    LTI_TOOL_CONFIGURATION = {
        'title': 'Sample LTI Tool',
        'description': 'This tool includes launch, navigation and assignments',
        'launch_url': 'lti/',
        'embed_url': '',  # @todo - add an editor embed example
        'embed_icon_url': '',
        'embed_tool_id': '',
        'landing_url': '/',
        'navigation': True,
        'new_tab': True,
        'course_aware': False,
        'frame_width': 1024,
        'frame_height': 1024,
        'assignments': {
         '1': '/assignment/1/',
         '2': '/assignment/2/',
        }
    }
    MIDDLEWARE = [
        "django.middleware.security.SecurityMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
    ]

    ROOT_URLCONF = "marsha.urls"

    TEMPLATES = [
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [],
            "APP_DIRS": True,
            "OPTIONS": {
                "context_processors": [
                    "django.template.context_processors.debug",
                    "django.template.context_processors.request",
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                ]
            },
        }
    ]

    AUTH_USER_MODEL = "core.User"

    WSGI_APPLICATION = "marsha.wsgi.application"

    # Password validation
    # https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators
    AUTH_PASSWORD_VALIDATORS = [
        {
            "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        },
        {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
        {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
        {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    ]

    # Internationalization
    # https://docs.djangoproject.com/en/2.0/topics/i18n/
    LOGGING = {
      "version": 1,
      "disable_existing_loggers": False,
      "formatters": {
        "complete": {"format": "%(levelname)s %(asctime)s %(name)s %(message)s"},
        "simple": {"format": "%(levelname)s %(message)s"},
      },
      "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
        "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"},
      },
      "handlers": {
        "null": {"level": "DEBUG", "class": "logging.NullHandler"},
        "console": {
            "level": "INFO",
            "filters": ["require_debug_true"],
            "class": "logging.StreamHandler",
            "formatter": "complete",
        },
      },
      "loggers": {
        "": {"handlers": ["console"], "level": "INFO"},
        "django": {"handlers": ["console"]},
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "botocore.vendored.requests.packages.urllib3.connectionpool": {
            "handlers": ["console"],
            "level": "ERROR",
        },
        "py.warnings": {"handlers": ["console"]},
      },
    }
    LANGUAGE_CODE = "en-us"

    LANGUAGES = [("en", _("english")), ("fr", _("french"))]

    TIME_ZONE = "UTC"

    USE_I18N = True

    USE_L10N = True

    USE_TZ = True


class Development(Base):
    """Development environment settings.

    We set ``DEBUG`` to ``True`` by default, configure the server to respond to all hosts,
    and use a local sqlite database by default.
    """

    BASE_DIR = os.path.dirname(__file__)

    DEBUG = values.BooleanValue(True)
    ALLOWED_HOSTS = ["*"]


class Test(Base):
    """Test environment settings."""

    pass
