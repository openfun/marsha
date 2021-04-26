#!/usr/bin/env bash
#
# Ensure front-end build is bundled in the image
#

MARSHA_IMAGE_NAME="${1:-marsha}"
MARSHA_IMAGE_TAG="${2:-latest}"

echo "Test statics for image ${MARSHA_IMAGE_NAME}:${MARSHA_IMAGE_TAG}..."

expected_statics_path="/data/static/js/build/index.js"

docker run --rm --env-file=env.d/development.dist "${MARSHA_IMAGE_NAME}:${MARSHA_IMAGE_TAG}" ls $expected_statics_path

exit_code=$?
expected=0

if [[ $exit_code -ne $expected ]]; then
    echo "Test statics: FAILED (exit code: $exit_code)"
    exit $exit_code
else
    echo "Test statics: SUCCEED"
    exit 0
fi
