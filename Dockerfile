# Marsha, a FUN LTI video provider

# ---- base image to inherit from ----
FROM python:3.10-bullseye as base

# ---- back-end builder image ----
FROM base as back-builder

# We want the most up-to-date stable pip release
RUN pip install --upgrade pip

WORKDIR /builder

# Only copy the setup files for dependencies install
COPY src/backend/setup.* /builder/

# Install Install xmlsec1 dependencies required for xmlsec (for SAML)
# Needs to be kept before the `pip install`
RUN apt-get update && \
    apt-get install -y \
    libxmlsec1-dev && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir /install && \
    pip install --prefix=/install .

# ---- front-end builder image ----
FROM node:16 as front-builder

WORKDIR /app

COPY ./src/frontend /app/

RUN yarn install --frozen-lockfile && \
    yarn compile-translations && \
    yarn sass scss/_main.scss /app/marsha/static/css/main.css --style=compressed --load-path=node_modules  && \
    mkdir -p /app/marsha/static/css/fonts && cp node_modules/katex/dist/fonts/* /app/marsha/static/css/fonts && \
    yarn build --mode=production --output-path /app/marsha/static/js/build/

# ---- mails ----
FROM node:16 as mail-builder
RUN mkdir -p /app/backend/marsha/core/templates/core/mail/html/ && \
    mkdir -p /app/backend/marsha/core/templates/core/mail/text/ && \
    mkdir -p /app/mail

COPY ./src/mail /app/mail

WORKDIR /app/mail

RUN yarn install --frozen-lockfile && \
    yarn build-mails

# ---- static link collector ----
FROM base as link-collector
ARG MARSHA_STATIC_ROOT=/data/static

# Install rdfind & libxmlsec1 (required to run django)
RUN apt-get update && \
    apt-get install -y \
    rdfind \
    libxmlsec1-dev libxmlsec1-openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy marsha backend application (see .dockerignore)
COPY ./src/backend /app/src/backend
# Copy front-end dependencies
COPY --from=front-builder /app/marsha/static /app/src/backend/marsha/static
COPY --from=mail-builder /app/backend/marsha/core/templates/core/mail /app/src/backend/marsha/core/templates/core/mail

WORKDIR /app/src/backend

# collecstatic
RUN DJANGO_CONFIGURATION=Build python manage.py collectstatic --noinput

# Replace duplicated file by a symlink to decrease the overall size of the
# final image
RUN rdfind -makesymlinks true -followsymlinks true -makeresultsfile false ${MARSHA_STATIC_ROOT}

# ---- final application image ----
FROM base
ARG MARSHA_STATIC_ROOT=/data/static
# Install gettext & latex + dvisvgm
# Also reinstall xmlsec1 dependency to provide .so required for runtime (SAML)
RUN apt-get update && \
    apt-get install -y \
    gettext texlive-latex-extra dvisvgm libxmlsec1 libxmlsec1-openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy application
COPY --from=link-collector /app /app

# Copy statics
COPY --from=link-collector ${MARSHA_STATIC_ROOT} ${MARSHA_STATIC_ROOT}

# Gunicorn
RUN mkdir -p /usr/local/etc/gunicorn
COPY docker/files/usr/local/etc/gunicorn/marsha.py /usr/local/etc/gunicorn/marsha.py
COPY docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

# Give the "root" group the same permissions as the "root" user on /etc/passwd
# to allow a user belonging to the root group to add new users; typically the
# docker user (see entrypoint).
RUN chmod g=u /etc/passwd

WORKDIR /app/src/backend

# We wrap commands run in this container by the following entrypoint that
# creates a user on-the-fly with the container user ID (see USER) and root group
# ID.
ENTRYPOINT [ "entrypoint" ]

# The default command runs gunicorn WSGI server
CMD ["gunicorn", "-c", "/usr/local/etc/gunicorn/marsha.py", "marsha.asgi:application"]

# Un-privileged user running the application
USER 10000
