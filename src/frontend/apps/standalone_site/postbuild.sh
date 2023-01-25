#!/usr/bin/env bash

DJANGO_STATIC_DIR="${DJANGO_STATIC_DIR:-"../../../backend/marsha/static"}"
BUILD_DIR="${DJANGO_STATIC_DIR}/js/build/site/"

# copy static files from build to django ones.
cp -rf "${BUILD_DIR}static/media/" "${DJANGO_STATIC_DIR}"

