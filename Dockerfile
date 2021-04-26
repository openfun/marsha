# Marsha, a FUN LTI video provider

# ---- base image to inherit from ----
FROM python:3.9-buster as base

# ---- back-end builder image ----
FROM base as back-builder

# We want the most up-to-date stable pip release
RUN pip install --upgrade pip

WORKDIR /builder

COPY src/backend/marsha src/backend/setup.* /builder/

RUN mkdir /install && \
    pip install --prefix=/install .

# ---- front-end builder image ----
FROM node:10 as front-builder

WORKDIR /app

COPY ./src/frontend /app/

RUN yarn install --frozen-lockfile && \
    yarn compile-translations && \
    yarn sass scss/_main.scss /app/marsha/static/css/main.css --style=compressed --load-path=node_modules  && \
    yarn build --mode=production --output-path /app/marsha/static/js/build/

# ---- static link collector ----
FROM base as link-collector
ARG MARSHA_STATIC_ROOT=/data/static

# Install rdfind
RUN apt-get update && \
    apt-get install -y \
    rdfind && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy marsha application (see .dockerignore)
COPY . /app/
# Copy front-end dependencies
COPY --from=front-builder /app/marsha/static /app/src/backend/marsha/static

WORKDIR /app/src/backend

# collecstatic
RUN DJANGO_CONFIGURATION=Build python manage.py collectstatic --noinput

# Replace duplicated file by a symlink to decrease the overall size of the
# final image
RUN rdfind -makesymlinks true -followsymlinks true -makeresultsfile false ${MARSHA_STATIC_ROOT}

# ---- final application image ----
FROM base
ARG MARSHA_STATIC_ROOT=/data/static
# Install gettext
RUN apt-get update && \
    apt-get install -y \
    gettext && \
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

# Give the "root" group the same permissions as the "root" user on /etc/passwd
# to allow a user belonging to the root group to add new users; typically the
# docker user (see entrypoint).
RUN chmod g=u /etc/passwd

WORKDIR /app/src/backend

# We wrap commands run in this container by the following entrypoint that
# creates a user on-the-fly with the container user ID (see USER) and root group
# ID.
ENTRYPOINT [ "/app/bin/entrypoint" ]

# The default command runs gunicorn WSGI server
CMD gunicorn -c /usr/local/etc/gunicorn/marsha.py marsha.wsgi:application

# Un-privileged user running the application
USER 10000
