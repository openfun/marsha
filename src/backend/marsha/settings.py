"""Django settings for marsha project.

Uses django-configurations to manage environments inheritance and the loading of some
config from the environment

"""
# pylint: disable=abstract-class-instantiated

from datetime import timedelta
import json
import os

from django.utils.translation import gettext_lazy as _

from configurations import Configuration, values
from corsheaders.defaults import default_headers
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_release():
    """
    Get the current release of the application.

    By release, we mean the release from the version.json file à la Mozilla [1]
    (if any). If this file has not been found, it defaults to "NA".
    [1]
    https://github.com/mozilla-services/Dockerflow/blob/master/docs/version_object.md
    """
    # Try to get the current release from the version.json file generated by the
    # CI during the Docker image build
    try:
        with open(os.path.join(BASE_DIR, "version.json"), encoding="utf8") as version:
            return json.load(version)["version"]
    except FileNotFoundError:
        return "NA"  # Default: not available


class Base(Configuration):
    """Base configuration every configuration (aka environment) should inherit from.

    It depends on an environment variable that SHOULD be defined:
    - DJANGO_SECRET_KEY

    You may also want to override default configuration by setting the following
    environment variables:
    - DJANGO_DEBUG
    """

    DATA_DIR = values.Value(os.path.join("/", "data"))

    # Static files (CSS, JavaScript, Images)
    STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)
    STATIC_URL = "/static/"
    MEDIA_URL = "/media/"
    # Allow to configure location of static/media files for non-Docker installation
    MEDIA_ROOT = values.Value(os.path.join(str(DATA_DIR), "media"))
    STATIC_ROOT = values.Value(os.path.join(str(DATA_DIR), "static"))

    SECRET_KEY = values.SecretValue()

    DEBUG = values.BooleanValue(False)

    DATABASES = {
        "default": {
            "ENGINE": values.Value(
                "django.db.backends.postgresql",
                environ_name="DATABASE_ENGINE",
                environ_prefix=None,
            ),
            "NAME": values.Value(
                "marsha", environ_name="POSTGRES_DB", environ_prefix=None
            ),
            "USER": values.Value(
                "marsha_user", environ_name="POSTGRES_USER", environ_prefix=None
            ),
            "PASSWORD": values.Value(
                "pass", environ_name="POSTGRES_PASSWORD", environ_prefix=None
            ),
            "HOST": values.Value(
                "localhost", environ_name="POSTGRES_HOST", environ_prefix=None
            ),
            "PORT": values.Value(
                5432, environ_name="POSTGRES_PORT", environ_prefix=None
            ),
        }
    }

    ALLOWED_HOSTS = []

    SITE_ID = 1

    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "same-origin"
    SILENCED_SYSTEM_CHECKS = values.ListValue([])

    # Application definition

    INSTALLED_APPS = [
        "django.contrib.admin.apps.SimpleAdminConfig",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.sites",
        "django.contrib.staticfiles",
        "django_extensions",
        "dockerflow.django",
        "waffle",
        "rest_framework",
        "corsheaders",
        "marsha.core.apps.CoreConfig",
        "marsha.bbb.apps.BbbConfig",
        "marsha.websocket.apps.WebsocketConfig",
        "channels",
    ]

    MIDDLEWARE = [
        "corsheaders.middleware.CorsMiddleware",
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
        "dockerflow.django.middleware.DockerflowMiddleware",
        "waffle.middleware.WaffleMiddleware",
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

    ASGI_APPLICATION = "marsha.asgi.application"
    
    
    # For sentinels:
    # CHANNEL_LAYERS = {
    #     'default': {
    #         'BACKEND': 'channels_redis.core.RedisChannelLayer',
    #         'CONFIG': {
    #             "hosts": [{
    #                 "sentinels": [(SENTINEL_HOST, SENTINEL_PORT)]m
    #                 "master_name": SENTINEL_MASTER,
    #             }],
    #         },
    #     },
    # }
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": values.ListValue(
                    [("redis", 6379)], environ_name="REDIS_HOST", environ_prefix=None
                ),
            },
        },
    }

    REST_FRAMEWORK = {
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTTokenUserAuthentication",
        ),
        "EXCEPTION_HANDLER": "marsha.core.views.exception_handler",
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
        "PAGE_SIZE": 50,
        "DEFAULT_THROTTLE_RATES": {
            "anon": "3/minute",
            "live_registration": "3/minute",
        },
    }

    # WAFFLE
    WAFFLE_CREATE_MISSING_SWITCHES = True

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

    JWT_SIGNING_KEY = values.Value(SECRET_KEY)

    # Internationalization
    # https://docs.djangoproject.com/en/2.0/topics/i18n/

    # Django sets `LANGUAGES` by default with all supported languages. Let's save it to a
    # different setting before overriding it with the languages active in Marsha. We can use it
    # for example for the choice of time text tracks languages which should not be limited to
    # the few languages active in Marsha.
    # pylint: disable=no-member
    ALL_LANGUAGES = Configuration.LANGUAGES

    LANGUAGE_CODE = "en-us"

    # Careful! Languages should be ordered by priority, as this tuple is used to get
    # fallback/default languages throughout the app.
    # Use "en" as default as it is the language that is most likely to be spoken by any visitor
    # when their preferred language, whatever it is, is unavailable
    LANGUAGES = [("en", _("english")), ("fr", _("french"))]
    LANGUAGES_DICT = dict(LANGUAGES)

    # Internationalization
    TIME_ZONE = "UTC"
    USE_I18N = True
    USE_L10N = True
    USE_TZ = True

    REACT_LOCALES = values.ListValue(["en_US", "es_ES", "fr_FR", "fr_CA"])

    VIDEO_RESOLUTIONS = [144, 240, 480, 720, 1080]
    STORAGE_BACKEND = values.Value("marsha.core.storage.s3")

    # Logging
    LOGGING = values.DictValue(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "loggers": {
                "marsha": {"handlers": ["console"], "level": "INFO", "propagate": True},
            },
        }
    )

    # AWS
    AWS_ACCESS_KEY_ID = values.SecretValue()
    AWS_SECRET_ACCESS_KEY = values.SecretValue()
    AWS_S3_REGION_NAME = values.Value("eu-west-1")
    AWS_S3_URL_PROTOCOL = values.Value("https")
    AWS_BASE_NAME = values.Value()
    UPDATE_STATE_SHARED_SECRETS = values.ListValue()
    AWS_UPLOAD_EXPIRATION_DELAY = values.Value(24 * 60 * 60)  # 24h
    AWS_MEDIALIVE_ROLE_ARN = values.SecretValue()
    AWS_MEDIAPACKAGE_HARVEST_JOB_ARN = values.SecretValue()

    # BBB
    BBB_ENABLED = values.BooleanValue(False)
    BBB_API_ENDPOINT = values.Value()
    BBB_API_SECRET = values.Value(None)

    # Cloud Front key pair for signed urls
    CLOUDFRONT_ACCESS_KEY_ID = values.Value(None)
    CLOUDFRONT_PRIVATE_KEY_PATH = values.Value(
        os.path.join(BASE_DIR, "..", ".ssh", "cloudfront_private_key")
    )
    CLOUDFRONT_SIGNED_URLS_ACTIVE = values.BooleanValue(True)
    CLOUDFRONT_SIGNED_URLS_VALIDITY = 2 * 60 * 60  # 2 hours

    CLOUDFRONT_DOMAIN = values.Value(None)

    BYPASS_LTI_VERIFICATION = values.BooleanValue(False)

    # Cache
    APP_DATA_CACHE_DURATION = values.Value(60)  # 60 secondes

    SENTRY_DSN = values.Value(None)

    # Resource max file size
    DOCUMENT_SOURCE_MAX_SIZE = values.Value(2 ** 30)  # 1GB
    VIDEO_SOURCE_MAX_SIZE = values.Value(2 ** 30)  # 1GB
    SUBTITLE_SOURCE_MAX_SIZE = values.Value(2 ** 20)  # 1MB
    THUMBNAIL_SOURCE_MAX_SIZE = values.Value(10 * (2 ** 20))  # 10MB
    SHARED_LIVE_MEDIA_SOURCE_MAX_SIZE = values.Value(300 * (2 ** 20))  # 300MB

    EXTERNAL_JAVASCRIPT_SCRIPTS = values.ListValue([])

    VIDEO_PLAYER = values.Value("videojs")
    FRONT_UPLOAD_POLL_INTERVAL = values.Value("60")

    MAINTENANCE_MODE = values.BooleanValue(False)

    # XMPP Settings
    LIVE_CHAT_ENABLED = values.BooleanValue(False)
    XMPP_BOSH_URL = values.Value(None)
    XMPP_WEBSOCKET_URL = values.Value(None)
    XMPP_CONFERENCE_DOMAIN = values.Value(None)
    XMPP_PRIVATE_ADMIN_JID = values.Value(None)
    XMPP_PRIVATE_SERVER_PORT = values.Value(5222)
    XMPP_PRIVATE_SERVER_PASSWORD = values.Value(None)
    XMPP_JWT_SHARED_SECRET = values.Value(None)
    XMPP_JWT_ISSUER = values.Value("marsha")
    XMPP_JWT_AUDIENCE = values.Value("marsha")
    XMPP_DOMAIN = values.Value(None)

    # LIVE SETTINGS
    NB_DAYS_BEFORE_DELETING_LIVE_RECORDINGS = values.Value(14)
    NB_SECONDS_LIVING_DEV_STACK = values.PositiveIntegerValue(600)
    LIVE_PLAYLIST_WINDOW_SECONDS = values.PositiveIntegerValue(10)
    LIVE_SEGMENT_DURATION_SECONDS = values.PositiveIntegerValue(4)
    LIVE_FRAMERATE_NUMERATOR = values.PositiveIntegerValue(24000)
    LIVE_FRAMERATE_DENOMINATOR = values.PositiveIntegerValue(1000)
    LIVE_GOP_SIZE = values.FloatValue(4)

    # JITSI SETTINGS
    JITSI_EXTERNAL_API_URL = values.Value("https://meet.jit.si/external_api.js")
    JITSI_DOMAIN = values.Value("meet.jit.si")
    JITSI_CONFIG_OVERWRITE = values.DictValue({})
    JITSI_INTERFACE_CONFIG_OVERWRITE = values.DictValue({})

    # LIVE PAIRING
    LIVE_PAIRING_EXPIRATION_SECONDS = 60

    # SHARED LIVE MEDIA SETTINGS
    ALLOWED_SHARED_LIVE_MEDIA_MIME_TYPES = values.ListValue(["application/pdf"])

    # Cors
    CORS_ALLOW_ALL_ORIGINS = values.BooleanValue(False)
    CORS_ALLOWED_ORIGINS = values.ListValue([])
    CORS_ALLOWED_ORIGIN_REGEXES = values.ListValue([])
    CORS_URLS_REGEX = values.Value(r"^/api/pairing-challenge$")
    CORS_ALLOW_METHODS = values.ListValue(["POST", "OPTIONS"])
    CORS_ALLOW_HEADERS = values.ListValue(list(default_headers))

    # pylint: disable=invalid-name
    @property
    def AWS_SOURCE_BUCKET_NAME(self):
        """Source bucket name.

        If this setting is set in an environment variable we use it. Otherwise
        the value is computed with the AWS_BASE_NAME value.
        """
        return os.environ.get(
            "DJANGO_AWS_SOURCE_BUCKET_NAME", f"{self.AWS_BASE_NAME}-marsha-source"
        )

    # pylint: disable=invalid-name
    @property
    def AWS_DESTINATION_BUCKET_NAME(self):
        """Destination bucket name.

        If this setting is set in an environment variable we use it. Otherwise
        the value is computed with the AWS_BASE_NAME value.
        """
        return os.environ.get(
            "DJANGO_AWS_DESTINATION_BUCKET_NAME",
            f"{self.AWS_BASE_NAME}-marsha-destination",
        )

    # pylint: disable=invalid-name
    @property
    def SIMPLE_JWT(self):
        """Define settings for `djangorestframework_simplejwt`.

        The JWT_SIGNING_KEY must be evaluated late as the jwt library check for string type.
        """
        return {
            "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
            "ALGORITHM": "HS256",
            "SIGNING_KEY": str(self.JWT_SIGNING_KEY),
            "USER_ID_CLAIM": "resource_id",
            "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
        }

    # pylint: disable=invalid-name
    @property
    def RELEASE(self):
        """
        Return the release information.

        Delegate to the module function to enable easier testing.
        """
        return get_release()

    @classmethod
    def _get_environment(cls):
        """Environment in which the application is launched."""
        return cls.__name__.lower()

    # pylint: disable=invalid-name
    @property
    def ENVIRONMENT(self):
        """Environment in which the application is launched."""
        return self._get_environment()

    @classmethod
    def post_setup(cls):
        """Post setup configuration.

        This is the place where you can configure settings that require other
        settings to be loaded.
        """
        super().post_setup()

        # The DJANGO_SENTRY_DSN environment variable should be set to activate
        # sentry for an environment
        if cls.SENTRY_DSN is not None:
            sentry_sdk.init(
                dsn=cls.SENTRY_DSN,
                environment=cls._get_environment(),
                release=get_release(),
                integrations=[DjangoIntegration()],
            )
            with sentry_sdk.configure_scope() as scope:
                scope.set_extra("application", "backend")


class Build(Base):
    """Settings used when the application is built.

    This environment should not be used to run the application. Just to build it with non blocking
    settings.
    """

    ALLOWED_HOSTS = None
    AWS_ACCESS_KEY_ID = values.Value("")
    AWS_SECRET_ACCESS_KEY = values.Value("")
    AWS_BASE_NAME = values.Value("")
    AWS_MEDIALIVE_ROLE_ARN = values.Value("")
    AWS_MEDIAPACKAGE_HARVEST_JOB_ARN = values.Value("")
    BBB_API_SECRET = values.Value("")
    SECRET_KEY = values.Value("DummyKey")
    STATICFILES_STORAGE = values.Value(
        "marsha.core.static.MarshaCompressedManifestStaticFilesStorage"
    )
    STATIC_POSTPROCESS_IGNORE_REGEX = values.Value(
        r"^js\/build\/[0-9]*\..*\.js(\.map)?$"
    )
    STATIC_POSTPROCESS_MAP_IGNORE_REGEX = values.Value(
        r"^js\/build\/[0-9]*\..*\.js\.map$"
    )


class Development(Base):
    """Development environment settings.

    We set ``DEBUG`` to ``True`` by default, configure the server to respond to all hosts.
    """

    ALLOWED_HOSTS = ["*"]
    AWS_BASE_NAME = values.Value("development")
    DEBUG = values.BooleanValue(True)
    CLOUDFRONT_SIGNED_URLS_ACTIVE = values.BooleanValue(False)
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}

    # Logging
    LOGGING = values.DictValue(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "gelf": {
                    "()": "logging_gelf.formatters.GELFFormatter",
                    "null_character": True,
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
                "gelf": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                    "formatter": "gelf",
                },
            },
            "loggers": {
                "marsha": {
                    "handlers": ["console"],
                    "level": "DEBUG",
                    "propagate": True,
                },
                # This formatter is here as an example to what is possible to do
                # with xapi loogers.
                "xapi": {"handlers": ["gelf"], "level": "INFO", "propagate": True},
            },
        }
    )


class Test(Base):
    """Test environment settings."""

    CLOUDFRONT_SIGNED_URLS_ACTIVE = False
    AWS_BASE_NAME = values.Value("test")
    # Enable it to speed up tests by stopping WhiteNoise from scanning your static files
    WHITENOISE_AUTOREFRESH = True
    LIVE_CHAT_ENABLED = False


class Production(Base):
    """Production environment settings.

    You must define the DJANGO_ALLOWED_HOSTS environment variable in Production
    configuration (and derived configurations):

    DJANGO_ALLOWED_HOSTS="foo.com,foo.fr"
    """

    ALLOWED_HOSTS = values.ListValue(None)

    STATICFILES_STORAGE = values.Value(
        "marsha.core.static.MarshaCompressedManifestStaticFilesStorage"
    )
    STATIC_POSTPROCESS_IGNORE_REGEX = values.Value(
        r"^js\/build\/[0-9]*\..*\.js(\.map)?$"
    )
    STATIC_POSTPROCESS_MAP_IGNORE_REGEX = values.Value(
        r"^js\/build\/[0-9]*\..*\.js\.map$"
    )

    AWS_BASE_NAME = values.Value("production")

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # pylint: disable=invalid-name
    @property
    def STATIC_URL(self):
        """Compute the absolute static url used in the lti template."""
        return f"//{self.CLOUDFRONT_DOMAIN}/static/"


class Staging(Production):
    """Staging environment settings."""

    AWS_BASE_NAME = values.Value("staging")


class PreProduction(Production):
    """Pre-production environment settings."""

    AWS_BASE_NAME = values.Value("preprod")
