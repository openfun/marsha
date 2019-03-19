PROJECT_NAME := $(shell python src/backend/setup.py --name)
PROJECT_VERSION := $(shell python src/backend/setup.py --version)

BOLD := \033[1m
RESET := \033[0m

# If you want to use your own virtualenv instead of Docker, set the NO_DOCKER variable to
# something not null. All commands are prepended or not by a "docker-compose" prefix depending on
# the value of this environment variable, so that they work in both cases.
ifndef NO_DOCKER
	# Docker
	COMPOSE              = docker-compose
	COMPOSE_RUN          = $(COMPOSE) run --rm
	COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
	COMPOSE_RUN_LRS	     = $(COMPOSE_RUN) api
	COMPOSE_RUN_CROWDIN  = $(COMPOSE_RUN) crowdin -c crowdin/config.yml
	COMPOSE_RUN_NODE     = $(COMPOSE_RUN) node
	COMPOSE_TEST         = $(COMPOSE) -p marsha-test -f docker/compose/test/docker-compose.yml --project-directory .
	COMPOSE_TEST_RUN     = $(COMPOSE_TEST) run --rm
	COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app
	YARN 								 = $(COMPOSE_RUN_NODE) yarn
endif

default: help

.PHONY : help
help:  ## Show this help
	@echo "$(BOLD)Marsha Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -h ':\s\+##' Makefile | column -tn -s# | awk -F ":" '{ print "  $(BOLD)" $$1 "$(RESET)" $$2 }'

##########################################################
# Targets that work for Docker or Virtualenv installations
#  (see above USE_DOCKER environment variable)

.PHONY: check
check:  ## Run all linters and checking tools
check: lint check-django check-migrations

.PHONY: lint
lint:  ## Run all linters (isort, black, flake8, pylint)
lint: lint-isort lint-black lint-flake8 lint-pylint

.PHONY: check-black
check-black:  ## Run the black tool in check mode only (won't modify files)
	@echo "$(BOLD)Checking black$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) black --check marsha/ 2>&1

.PHONY: lint-black
lint-black:  ## Run the black tool and update files that need to
	@echo "$(BOLD)Running black$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) black marsha/

.PHONY: lint-flake8
lint-flake8:  ## Run the flake8 tool
	@echo "$(BOLD)Running flake8$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) flake8 marsha --format=abspath

.PHONY: lint-pylint
lint-pylint:  ## Run the pylint tool
	@echo "$(BOLD)Running pylint$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) pylint --rcfile=pylintrc marsha

.PHONY: lint-isort
lint-isort:  ## automatically re-arrange python imports in code base
	@echo "$(BOLD)Running isort$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) isort marsha --recursive --atomic

.PHONY: check-django
check-django:  ## Run the Django "check" command
	@echo "$(BOLD)Checking django$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) python manage.py check

.PHONY: check-migrations
check-migrations:  ## Check that all needed migrations exist
	@echo "$(BOLD)Checking migrations$(RESET)"
	@$(COMPOSE_TEST_RUN_APP) python manage.py makemigrations --check --dry-run

.PHONY: migrate
migrate:  ## Run django migration for the marsha project.
	@echo "$(BOLD)Running migrations$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py migrate

superuser: ## create a Django superuser
	@echo "$(BOLD)Creating a Django superuser$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py createsuperuser
.PHONY: superuser

.PHONY: test
test:  ## Run django tests for the marsha project.
	@echo "$(BOLD)Running tests$(RESET)"
	# we use a test-runner that does not run the django check command as its done in another job
	@$(COMPOSE_TEST_RUN_APP) python manage.py test --testrunner marsha.test_runner.NoCheckDiscoverRunner

.PHONY: build-front
build-front: ## Build front application
	@$(YARN) generate-translations
	@$(YARN) build

.PHONY: watch-front
watch-front: ## Build front application and activate watch mode
	@$(YARN) build --watch



##############################################
# Targets specific to Virtualenv installations

.PHONY: venv-install
venv-install:  ## Install the project in the current environment, with its dependencies
	@echo "$(BOLD)Installing $(PROJECT_NAME) $(PROJECT_VERSION)$(RESET)"
	@pip install .

.PHONY: venv-install-dev
venv-install-dev:  ## Install the project in the current environment, with its dependencies, including the ones needed in a development environment
	@echo "$(BOLD)Installing $(PROJECT_NAME) $(PROJECT_VERSION) in dev mode$(RESET)"
	@pip install -e .[dev]

.PHONY: venv-upgrade-dev
venv-upgrade-dev:  ## Upgrade all default+dev dependencies defined in setup.cfg
	@pip install --upgrade `python -c 'import setuptools; o = setuptools.config.read_configuration("setup.cfg")["options"]; print(" ".join(o["install_requires"] + o["extras_require"]["dev"]))'`
	@pip install -e .


##########################################
# Targets specific to Docker installations

env.d/development:
	cp env.d/development.dist env.d/development

.PHONY: bootstrap
bootstrap: env.d/development ## Prepare Docker images for the project
	@$(COMPOSE) build base;
	@$(COMPOSE) build app;
	@echo 'Waiting until database is up…';
	$(COMPOSE_RUN_APP) dockerize -wait tcp://db:5432 -timeout 60s
	${MAKE} migrate;
	${MAKE} i18n-compile-back

.PHONY: run
run: ## start the development server using Docker
	@$(COMPOSE) up -d

.PHONY: stop
stop: ## stop the development server using Docker
	@$(COMPOSE) stop

.PHONY: down
down: ## Stop and remove containers, networks, images, and volumes
	@$(COMPOSE) down

###########################################
# Translations tasks

.PHONY: i18n-generate
i18n-generate: ## Generate source translations files for all applications
	${MAKE} i18n-generate-back;
	${MAKE} i18n-generate-front;

.PHONY: i18n-compile
i18n-compile: ## Compile translated messages to be used by all applications
	${MAKE} i18n-compile-back
	${MAKE} i18n-compile-front

.PHONY: i18n-generate-front
i18n-generate-front:
	@$(YARN) build
	@$(YARN) generate-l10n-template

.PHONY: i18n-compile-front
i18n-compile-front:
	@$(YARN) generate-translations

.PHONY: i18n-generate-back
i18n-generate-back:
	@$(COMPOSE_RUN_APP) python manage.py makemessages --ignore "venv/**/*" --keep-pot

.PHONY: i18n-compile-back
i18n-compile-back:
	@$(COMPOSE_RUN_APP) python manage.py compilemessages

.PHONY: crowdin-upload
crowdin-upload: ## Upload source translations to crowdin
	@$(COMPOSE_RUN_CROWDIN) upload sources

.PHONY: crowdin-download
crowdin-download: ## Download translated message from crowdin
	@$(COMPOSE_RUN_CROWDIN) download translations

.PHONY: i18n-generate-and-upload
i18n-generate-and-upload: ## Generate source translations for all applications and upload then to crowdin
	${MAKE} i18n-generate
	${MAKE} crowdin-upload

.PHONY: i18n-download-and-compile
i18n-download-and-compile: ## Download all translated messages and compile them to be used be all applications
	${MAKE} crowdin-download
	${MAKE} i18n-compile
