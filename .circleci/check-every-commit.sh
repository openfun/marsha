#!/usr/bin/env bash

# A tool to check that every commit in the git history is valid
#
# We decide if a commit is valid if one of this is true:
# - it is managed by a continuous integration tool
# - a list of "make" targets are all successfully run on this commit
#
# For each commit where the make targets are executed, the script will post a status on Github.
# And at the end, if at least one target failed, it will exit with the exit code "1" so it can be used by a CI
# to mark the job as failed.
#
# The result are stored on a Github gist, to avoid executing checks for a commit many times. So this should be fast,
# depending on the number of new commits.
#
#
# Invocation
# ==========
# GITHUB_BOT_TOKEN="sometoken" path/to/.circleci/check-every-commit.sh
#
#
# Requirements
# ============
# - git
# - curl
# - jq
#
# Environment
# ===========
# GITHUB_BOT_TOKEN: str
#     A token allowed to read/write commit statuses on the api for `GITHUB_REPOSITORY` and to read/write the
#     Github gist defined by `GIST_ACCOUNT` and `GIST_ID`.
#     If not defined, commit statuses won't be touched, and gist will only be read.
#
#
# Configuration
# =============
# The following variable can be configured.
#
# GITHUB_REPOSITORY: str
#     The Github repository we are working on.
# GIST_ACCOUNT: str
#     The Github account used to host the gist file storing the commits already checked.
#     If not defined, no gist will be read/written.
# GIST_ID: str
#     The Github identifier of the gist file.
#     If not defined, no gist will be read/written.
# CI: str
#     The name of the used continuous integration tool. Will be used to check if a commit was already checked by the CI
#     to avoid doing our checks on it. Use a single word that can be found in the statuses, like "circleci", "travis"...
# TOOL_NAME: str
#      The name of this tool as it will appear in the statuses.
# MAKE_TARGETS: str
#     A string containing a space separated list of make targets we want to run on each commit.
# POST_FINAL_STATUS: bool
#     A boolean ("FALSE" or "TRUE") indicating if at the end we should post a status on Github for the actual git HEAD.
#     Default to False.


GITHUB_REPOSITORY="openfun/marsha"
GIST_ACCOUNT="funmoocbot"
GIST_ID="94ea3f4054e4d250104e1bb98c92f2af"
CI="circleci"
TOOL_NAME="commit-tester"
MAKE_TARGETS="check test"
POST_FINAL_STATUS="${POST_FINAL_STATUS:-FALSE}"

# End of configuration

GITHUB_API_GIST_ROOT="https://api.github.com/gists"
GITHUB_API_REPO_ROOT="https://api.github.com/repos/${GITHUB_REPOSITORY}"

GITHUB_BOT_TOKEN="${GITHUB_BOT_TOKEN:-""}"
GITHUB_AUTH="''"
if [ "${GITHUB_BOT_TOKEN}" ]
then
    GITHUB_AUTH="Authorization: token ${GITHUB_BOT_TOKEN}"
fi

PROJECT=$(echo "${GITHUB_REPOSITORY}" | cut -d/ -f2)
GIST_FILE="${TOOL_NAME}-${PROJECT}.checks"
TMP_DIR=~/"${TOOL_NAME}-${PROJECT}"
LOCAL_FILE="${TMP_DIR}/${GIST_FILE}"
GIT_HEAD=$(git rev-parse HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
FAILURES=0

BOLD="\033[1m"
RESET="\033[0m"
RED="\033[91m"
GREEN="\033[92m"

post_status () {
    # Will add/update a status on a Github commit
    #
    # Parameters
    # ==========
    # 1: str
    #     The git SHA1 for for which we have a failure/success
    # 2: str
    #     The ``make`` target for which we want to add the status.
    #     Can be "__all__" to note that it's a global status.
    # 3: str
    #     The status for this commit. Must be one of "failure" or "success"
    # 4: str
    #     String to add to the end of the description

    if [ "${GITHUB_BOT_TOKEN}" ]
    then
        local GIT_SHA1="$1"
        local TARGET="$2"
        local STATUS="$3"
        local DESC_EXT="$4"

        local CONTEXT="${TOOL_NAME}/${TARGET}"
        local DESC="'make ${TARGET}' for git rev ${GIT_SHA1}${DESC_EXT}"

        if [ "${TARGET}" == "__all__" ]
        then
            local CONTEXT="${TOOL_NAME}"
            local DESC="Commits history status: ${STATUS}${DESC_EXT}"
        fi

        curl -fs -H "${GITHUB_AUTH}"  "${GITHUB_API_REPO_ROOT}/statuses/${GIT_SHA1}" --data "{\"state\": \"${STATUS}\", \"context\": \"${CONTEXT}\", \"description\": \"${DESC}\"}" -o /dev/null
    fi
}

add_mark () {
    # Add a mark in the local file for a commit
    #
    # Parameters
    # ==========
    # 1: str
    #    The git SHA1 for which to add a mark
    # 2: str
    #    The name of the tool for which to add the mark. Must be one defined by `$CI` or `$TOOL_NAME`
    # 3: str
    #    The ``make`` target for which to add a mark. Only if $2 is the tool name.
    # 4: str
    #    The status for this mark. Must be one of "failure" or "success" or "skipped". Only if $2 is the tool name.

    local GIT_SHA1="$1"
    local TOOL_NAME="$2"
    if [ "${TOOL_NAME}" == "${CI}" ]
    then
        echo "${GIT_SHA1}#${TOOL_NAME}" >> "${LOCAL_FILE}"
    else
        local TARGET="$3"
        local STATUS="$4"
        echo "${GIT_SHA1}#${TOOL_NAME}#${TARGET}#${STATUS}" >> "${LOCAL_FILE}"
    fi
}


echo ""
echo "========="
echo -e "${BOLD}Preparing${RESET}"
echo "========="

mkdir -p "${TMP_DIR}"

# Get already done commits
if [ "${GIST_ACCOUNT}${GIST_ID}" ]
then
    curl -fs "https://gist.githubusercontent.com/${GIST_ACCOUNT}/${GIST_ID}/raw/${GIST_FILE}" | sort -u > "${LOCAL_FILE}"
else
    # Set an empty file if we don't already have it
    if [ ! -e "${LOCAL_FILE}" ]
    then
        echo "" > "${LOCAL_FILE}"
    fi
fi


# Working on all commits, starting at the older one
for GIT_SHA1 in $(git rev-list HEAD | tac)
do
    # If commit already marked as managed by the CI, ignore it
    if [ "$(grep "${GIT_SHA1}#${CI}" ${LOCAL_FILE})" ]
    then
        continue
    fi

    TARGETS_TO_DO=""
    for TARGET in ${MAKE_TARGETS}
    do
        # Check if this target is already marked as failed in the local file
        if [ "$(grep "${GIT_SHA1}#${TOOL_NAME}#${TARGET}#\(error\|failure\)" ${LOCAL_FILE})" ]
        then
            echo ""
            echo -e "${BOLD}${GIT_SHA1}${RESET} already marked as ${BOLD}${RED}failed${RESET} for target '${BOLD}make ${TARGET}${RESET}'"
            FAILURES=$((FAILURES+1))
            # Force update on github on this commit
            post_status "${GIT_SHA1}" ${TARGET} "failure"

        else
            # We'll run the target if it's not already done
            if [ ! "$(grep "${GIT_SHA1}#${TOOL_NAME}#${TARGET}#" "${LOCAL_FILE}")" ]
            then
                TARGETS_TO_DO="${TARGETS_TO_DO} ${TARGET}"
            fi
        fi
    done

    # We stop for this commit if we have no target to run
    if [ ! "${TARGETS_TO_DO}" ]
    then
        continue
    fi

    # Get the github statuses for this commit if we don't already have it
    STATUSES_FILE="${TMP_DIR}/${GIT_SHA1}.statuses"
    if [ ! -e "${STATUSES_FILE}" ]  # Use an existing status file if we have it to speed up the script
    then
        curl -fs -H "${GITHUB_AUTH}" "${GITHUB_API_REPO_ROOT}/commits/${GIT_SHA1}/statuses" | jq -r  '.[] | "\(.state)# \(.context)"' > "${STATUSES_FILE}"
    fi

    # If the commit is already managed by the CI, bypass it and mark it as ok
    if [ "$(grep "${CI}" "${STATUSES_FILE}")" ]
    then
        add_mark "${GIT_SHA1}" "${CI}"
        continue
    fi

    # Now we can really work on the commit

    # Read the commit description to print it
    DESC=`git log --format=%B -n 1 ${GIT_SHA1} | head -n 1`

    echo ""
    echo "==============================================================================="
    echo -e "${BOLD}Working on ${GIT_SHA1}${RESET}: ${DESC}"
    echo "==============================================================================="

    echo ""
    echo "Preparing working directory..."
    echo ""

    # Go on the correct commit and install needed things
    git checkout -q "${GIT_SHA1}"
    pip install -q -e .[dev]

    MAKE_FAILURES=""
    for TARGET in ${TARGETS_TO_DO}
    do
        # Check if this commit can handle the target
        make -n ${TARGET} &>/dev/null
        if [ "$?" == "2" ]
        then
            # We mark the target for this commit as skipped to ignore it next time
            add_mark "${GIT_SHA1}" "${TOOL_NAME}" "${TARGET}" "skipped"
            continue
        fi

        # We run the target
        echo ""
        echo -e "Run '${BOLD}make ${TARGET}${RESET}' for ${BOLD}${GIT_SHA1}${RESET}"
        echo ""

        make ${TARGET}

        # Handle success/failure of the make target
        if [ "$?" == "0" ]
        then
            echo ""
            echo -e "'${BOLD}make ${TARGET}${RESET}' is a ${BOLD}${GREEN}success${RESET} for ${BOLD}${GIT_SHA1}${RESET}"
            echo ""
            add_mark "${GIT_SHA1}" "${TOOL_NAME}" "${TARGET}" "success"
            post_status "${GIT_SHA1}" ${TARGET} "success"
        else
            echo ""
            echo -e "'${BOLD}make ${TARGET}${RESET}' is a ${BOLD}${RED}failure${RESET} for ${BOLD}${GIT_SHA1}${RESET}"
            echo ""
            MAKE_FAILURES="${MAKE_FAILURES}${TARGET} "
            FAILURES=$((FAILURES+1))
            add_mark "${GIT_SHA1}" "${TOOL_NAME}" "${TARGET}" "failure"
            post_status "${GIT_SHA1}" ${TARGET} "failure"
        fi
    done

    echo ""
    if [ "${MAKE_FAILURES}" == "" ]
    then
        echo -e "${BOLD}${GIT_SHA1}${RESET} ${BOLD}${GREEN}passed${RESET} all targets"
    else
        echo -e "${BOLD}${GIT_SHA1}${RESET} ${BOLD}${RED}failed${RESET} on: ${MAKE_FAILURES}"
    fi

done

echo ""
echo "======="
echo -e "${BOLD}SUMMARY${RESET}"
echo "======="

git checkout -q "${GIT_BRANCH}"

if [ ${FAILURES} -eq 0 ]
then
    EXIT_STATUS=0
    echo ""
    echo -e "${BOLD}STATUS: ${GREEN}SUCCESS${RESET}"
    if [ "${POST_FINAL_STATUS}" == "TRUE" ]
    then
        post_status "${GIT_HEAD}" "__all__" "success"
    fi
else
    EXIT_STATUS=1
    echo ""
    echo -e "${BOLD}STATUS: ${RED}FAILURE${RESET} - ${FAILURES} failure(s)"
    if [ "${POST_FINAL_STATUS}" == "TRUE" ]
    then
        post_status "${GIT_HEAD}" "__all__" "failure" " - ${FAILURES} failure(s)"
    fi
fi


if [ "${GIST_ACCOUNT}${GIST_ID}" ]
then
    # We can update the gist file with status for all commits (with "\n" for new lines)
    GIST_CONTENT=$(cat "${LOCAL_FILE}" | awk '{ printf($0 "\\n") }')
    curl -fs -H "${GITHUB_AUTH}" -X PATCH -d "{\"files\": {\"${GIST_FILE}\": {\"content\": \"${GIST_CONTENT}\"}}}" ${GITHUB_API_GIST_ROOT}/${GIST_ID} -o /dev/null
fi

exit ${EXIT_STATUS}
