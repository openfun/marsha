# Marsha's Makefile
#
# /!\ /!\ /!\ /!\ /!\ /!\ /!\ DISCLAIMER /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\
#
# This Makefile is only meant to be used for DEVELOPMENT purpose.
#
# PLEASE DO NOT USE IT FOR YOUR CI/PRODUCTION/WHATEVER...
#
# /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\
#
# Note to developpers:
#
# While editing this file, please respect the following statements:
#
# 1. Every variable should be defined in the ad hoc VARIABLES section with a
#    relevant subsection
# 2. Every new rule should be defined in the ad hoc RULES section with a
#    relevant subsection depending on the targeted service
# 3. Rules should be sorted alphabetically within their section
# 4. When a rule has multiple dependencies, you should:
#    - duplicate the rule name to add the help string (if required)
#    - write one dependency per line to increase readability and diffs
# 5. .PHONY rule statement should be written after the corresponding rule

# ==============================================================================
# VARIABLES

# -- Project
PROJECT_NAME := $(shell python src/backend/setup.py --name)
PROJECT_VERSION := $(shell python src/backend/setup.py --version)

BOLD := \033[1m
RESET := \033[0m

# -- Docker
COMPOSE              = docker-compose
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
COMPOSE_RUN_CROWDIN  = $(COMPOSE_RUN) crowdin crowdin
COMPOSE_RUN_NODE     = $(COMPOSE_RUN) node
YARN                 = $(COMPOSE_RUN_NODE) yarn

# ==============================================================================
# RULES

default: help

# -- Project

bootstrap: ## Prepare Docker images for the project
bootstrap: \
	env.d/development \
	build \
	run \
	migrate \
	i18n-compile-back
.PHONY: bootstrap

# -- Docker/compose

build: ## build the app container
	@$(COMPOSE) build base;
	@$(COMPOSE) build app;
.PHONY: build

down: ## Stop and remove containers, networks, images, and volumes
	@$(COMPOSE) down
.PHONY: down

logs: ## display app logs (follow mode)
	@$(COMPOSE) logs -f app
.PHONY: logs

run: ## start the development server using Docker
	@$(COMPOSE) up -d
	@echo "Wait for postgresql to be up..."
	@$(COMPOSE_RUN) dockerize -wait tcp://db:5432 -timeout 60s
.PHONY: run

stop: ## stop the development server using Docker
	@$(COMPOSE) stop
.PHONY: stop

# -- Back-end


check: ## Run all linters and checking tools
check: \
	lint \
	check-django \
	check-migrations
.PHONY: check

check-black:  ## Run the black tool in check mode only (won't modify files)
	@echo "$(BOLD)Checking black$(RESET)"
	@$(COMPOSE_RUN_APP) black --check marsha/ 2>&1
.PHONY: check-black

check-django:  ## Run the Django "check" command
	@echo "$(BOLD)Checking django$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py check
.PHONY: check-django

check-migrations:  ## Check that all needed migrations exist
	@echo "$(BOLD)Checking migrations$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py makemigrations --check --dry-run
.PHONY: check-migrations

collectstatic:  ## Collect and deploy static files for the marsha project.
	@echo "$(BOLD)Collecting static files$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py collectstatic
.PHONY: collectstatic

lint:  ## Run all linters (isort, black, flake8, pylint)
lint: \
	lint-isort \
	lint-black \
	lint-flake8 \
	lint-pylint \
	lint-bandit
.PHONY: lint

lint-black:  ## Run the black tool and update files that need to
	@echo "$(BOLD)Running black$(RESET)"
	@$(COMPOSE_RUN_APP) black marsha/
.PHONY: lint-black

lint-flake8:  ## Run the flake8 tool
	@echo "$(BOLD)Running flake8$(RESET)"
	@$(COMPOSE_RUN_APP) flake8 marsha --format=abspath
.PHONY: lint-flake8

lint-isort:  ## automatically re-arrange python imports in code base
	@echo "$(BOLD)Running isort$(RESET)"
	@$(COMPOSE_RUN_APP) isort marsha --atomic
.PHONY: lint-isort

lint-pylint:  ## Run the pylint tool
	@echo "$(BOLD)Running pylint$(RESET)"
	@$(COMPOSE_RUN_APP) pylint --rcfile=pylintrc marsha
.PHONY: lint-pylint

lint-bandit: ## lint back-end python sources with bandit
	@echo "$(BOLD)Running bandit$(RESET)"
	@$(COMPOSE_RUN_APP) bandit -c .bandit -qr marsha
.PHONY: lint-bandit


migrate:  ## Run django migration for the marsha project.
	@echo "$(BOLD)Running migrations$(RESET)"
	@$(COMPOSE) up -d db
	@$(COMPOSE_RUN) dockerize -wait tcp://db:5432 -timeout 60s
	@$(COMPOSE_RUN_APP) python manage.py migrate
.PHONY: migrate

superuser: ## create a Django superuser
	@echo "$(BOLD)Creating a Django superuser$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py createsuperuser
.PHONY: superuser

.PHONY: test
test:  ## Run django tests for the marsha project.
	@echo "$(BOLD)Running tests$(RESET)"
	bin/pytest

## -- Front-end

build-front: ## Build front application
build-front: \
	build-ts \
	build-sass
.PHONY: build-front

build-sass: ## Build Sass file to CSS
	@$(YARN) build-sass
.PHONY: build-sass

build-ts: ### Build TypeScript application
	@$(YARN) compile-translations
	@$(YARN) build
.PHONY: build-ts

watch-front: ## Build front application and activate watch mode
	@$(YARN) build --watch
.PHONY: watch-front

# -- Internationalization

crowdin-download: ## Download translated message from crowdin
	@$(COMPOSE_RUN_CROWDIN) download -c crowdin/config.yml
.PHONY: crowdin-download

crowdin-upload: ## Upload source translations to crowdin
	@$(COMPOSE_RUN_CROWDIN) upload sources -c crowdin/config.yml
.PHONY: crowdin-upload

i18n-compile: ## Compile translated messages to be used by all applications
i18n-compile: \
	i18n-compile-back \
	i18n-compile-front
.PHONY: i18n-compile

i18n-compile-back:
	@$(COMPOSE_RUN_APP) python manage.py compilemessages
.PHONY: i18n-compile-back

i18n-compile-front:
	@$(YARN) compile-translations
.PHONY: i18n-compile-front

i18n-generate: ## Generate source translations files for all applications
i18n-generate: \
	i18n-generate-back \
	i18n-generate-front
.PHONY: i18n-generate

i18n-generate-back:
	@$(COMPOSE_RUN_APP) python manage.py makemessages --ignore "venv/**/*" --keep-pot
.PHONY: i18n-generate-back

i18n-generate-front:
	@$(YARN) build
	@$(YARN) extract-translations
.PHONY: i18n-generate-front


i18n-generate-and-upload: ## Generate source translations for all applications and upload then to crowdin
i18n-generate-and-upload: \
	i18n-generate \
	crowdin-upload
.PHONY: i18n-generate-and-upload

i18n-download-and-compile: ## Download all translated messages and compile them to be used be all applications
i18n-download-and-compile: \
	crowdin-download \
	i18n-compile
.PHONY: i18n-download-and-compile

# -- Misc

env.d/development:
	cp env.d/development.dist env.d/development

help:  ## Show this help
	@echo "$(BOLD)Marsha Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -h ':\s\+##' Makefile | column -tn -s# | awk -F ":" '{ print "  $(BOLD)" $$1 "$(RESET)" $$2 }'
.PHONY: help
