"""Django settings for marsha project.

Uses django-configurations to manage environments inheritance and the loading of some
config from the environment

"""

from datetime import timedelta
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
        "rest_framework",
        "marsha.core.apps.CoreConfig",
    ]

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

    REST_FRAMEWORK = {
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTTokenUserAuthentication",
        )
    }

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

    JWT_SIGNING_KEY = values.SecretValue()

    # Internationalization
    # https://docs.djangoproject.com/en/2.0/topics/i18n/

    LANGUAGE_CODE = "en-us"

    LANGUAGES = [("en", _("english")), ("fr", _("french"))]

    # Internationalization
    TIME_ZONE = "UTC"
    USE_I18N = True
    USE_L10N = True
    USE_TZ = True

    VIDEO_RESOLUTIONS = [144, 240, 480, 720, 1080]

    # AWS
    AWS_ACCESS_KEY_ID = values.SecretValue()
    AWS_SECRET_ACCESS_KEY = values.SecretValue()
    AWS_DEFAULT_REGION = values.Value("eu-west-1")

    # Cloud Front key pair for signed urls
    CLOUDFRONT_URL = values.SecretValue()
    CLOUDFRONT_ACCESS_KEY_ID = values.Value(None)
    CLOUDFRONT_PRIVATE_KEY_PATH = os.path.join(
        BASE_DIR, "..", ".ssh", "cloudfront_private_key"
    )
    CLOUDFRONT_SIGNED_URLS_ACTIVE = True
    CLOUDFRONT_SIGNED_URLS_VALIDITY = 2 * 60 * 60  # 2 hours

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
            "USER_ID_CLAIM": "video_id",
            "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
        }


class Development(Base):
    """Development environment settings.

    We set ``DEBUG`` to ``True`` by default, configure the server to respond to all hosts,
    and use a local sqlite database by default.
    """

    DEBUG = values.BooleanValue(True)
    ALLOWED_HOSTS = ["*"]

    AWS_SOURCE_BUCKET_NAME = "development-marsha-source"


class Test(Base):
    """Test environment settings."""

    AWS_SOURCE_BUCKET_NAME = "test-marsha-source"

    CLOUDFRONT_SIGNED_URLS_ACTIVE = False
