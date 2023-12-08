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

include env.d/development
include env.d/localtunnel

BOLD := \033[1m
RESET := \033[0m
GREEN := \033[1;32m

# -- Docker
DOCKER_UID           = $(shell id -u)
DOCKER_GID           = $(shell id -g)
DOCKER_USER          = $(DOCKER_UID):$(DOCKER_GID)
COMPOSE              = DOCKER_USER=$(DOCKER_USER) ./bin/docker-compose
COMPOSE_BUILD        = DOCKER_USER=$(DOCKER_USER) COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 $(COMPOSE) build
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
COMPOSE_RUN_CROWDIN  = $(COMPOSE_RUN) crowdin crowdin
COMPOSE_RUN_LAMBDA   = $(COMPOSE_RUN) --entrypoint "" # disable lambda entrypoint to run command in container
COMPOSE_RUN_MAIL  	 = $(COMPOSE_RUN) mail-generator yarn 
COMPOSE_RUN_NODE     = $(COMPOSE_RUN) node
YARN                 = $(COMPOSE_RUN_NODE) yarn

# ==============================================================================
# RULES

default: h

# -- Project

bootstrap: ## Prepare Docker images for the project
bootstrap: \
	env.d/development \
	env.d/localtunnel \
	env.d/lambda \
	build \
	build-lambda-dev \
	run \
	migrate \
	i18n-compile-back \
	install-mails \
	build-mails \
	prosody-admin \
	install-webtorrent
.PHONY: bootstrap

# -- Docker/compose

build: ## build the app container
	@$(COMPOSE_BUILD) base;
	@$(COMPOSE_BUILD) app;
	@$(COMPOSE_BUILD) e2e;
.PHONY: build

build-backend-dev: ## build the app container
	@$(COMPOSE_BUILD) app;
.PHONY: build-backend-dev

build-lambda-dev: ## build all aws lambda
	@bin/lambda build dev development
.PHONY: build-lambda-dev

down: ## Stop and remove containers, networks, images, and volumes
	@$(COMPOSE) down
.PHONY: down

reset: ## Reset the project by destroying all containers, migrate the database and then recreate missing containers and finally create the prosody admin
reset: \
	down \
	migrate \
	run \
	prosody-admin
.PHONY: reset

logs: ## display app logs (follow mode)
	@$(COMPOSE) logs --tail="100" -f app
.PHONY: logs

run: ## start the development server using Docker
	@$(COMPOSE) up -d app
	@echo "Wait for postgresql to be up..."
	@$(COMPOSE_RUN) dockerize -wait tcp://db:5432 -timeout 60s
	@$(COMPOSE) up -d prosody-nginx
	@$(COMPOSE) up -d webtorrent
	@$(COMPOSE) up -d peertube-runner
.PHONY: run

shell:
	@$(COMPOSE_RUN) app /bin/bash
.PHONY: shell

tunnel: ## start the development server using Docker through localtunnel
tunnel: run
	@echo
	npx localtunnel -s $(LOCALTUNNEL_SUBDOMAIN) -h $(LOCALTUNNEL_HOST) --port $(LOCALTUNNEL_PORT) --print-requests
.PHONY: tunnel

tunnel-apply: ## start the development server using Docker through localtunnel
tunnel-apply:
	@echo "$(BOLD)Applying configuration for:$(RESET)"
	@bin/get_tunnel_url
	@echo
	@make -C src/aws/ apply
	@echo
	@echo "$(BOLD)Configuration applied for:$(RESET)"
	@bin/get_tunnel_url
.PHONY: tunnel-apply


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

makemigrations:  ## Generate potential migrations
	@echo "$(BOLD)Generate potential migrations$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py makemigrations
.PHONY: makemigrations

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
	@$(COMPOSE_RUN_APP) black marsha/ --exclude='.cookiecutter'
.PHONY: lint-black

lint-flake8:  ## Run the flake8 tool
	@echo "$(BOLD)Running flake8$(RESET)"
	@$(COMPOSE_RUN_APP) flake8 marsha
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

resetdb:  ## Reset local database for the marsha project.
	@echo "$(BOLD)Drop database and recreate$(RESET)"
	@$(COMPOSE) up -d db
	@$(COMPOSE_RUN) dockerize -wait tcp://db:5432 -timeout 60s
	@$(COMPOSE_RUN_APP) python manage.py load_development_datasets --flush-db
.PHONY: resetdb

superuser: ## create a Django superuser
	@echo "$(BOLD)Creating a Django superuser$(RESET)"
	@$(COMPOSE_RUN_APP) python manage.py createsuperuser
.PHONY: superuser

prosody-admin: ## create prosody admin user
	@echo "$(BOLD)Creating a prosody admin$(RESET)"
	$(COMPOSE_RUN) prosody-app prosodyctl register admin prosody-app "${DJANGO_XMPP_PRIVATE_SERVER_PASSWORD}"
.PHONY: 

test:  ## Run django tests for the marsha project.
	@echo "$(BOLD)Running tests$(RESET)"
	bin/pytest marsha --ignore=marsha/e2e
.PHONY: test

build-e2e: ## build the e2e container
	@$(COMPOSE_BUILD) --no-cache e2e;
.PHONY: build-e2e

e2e: ## Run e2e tests for the marsha project.
e2e: \
	e2e-ff \
	e2e-wk \
	e2e-cr
.PHONY: e2e

e2e-ff:  ## Run firefox e2e tests for the marsha project.
	@echo "$(BOLD)Running firefox e2e tests$(RESET)"
	bin/e2e --browser firefox --tracing on marsha/e2e/
.PHONY: e2e-ff

e2e-wk:  ## Run webkit e2e tests for the marsha project.
	@echo "$(BOLD)Running webkit e2e tests$(RESET)"
	bin/e2e --browser webkit --tracing on marsha/e2e/
.PHONY: e2e-wk

e2e-cr:  ## Run chromium e2e tests for the marsha project.
	@echo "$(BOLD)Running chromium e2e tests$(RESET)"
	bin/e2e --browser chromium --browser-channel chrome --tracing on marsha/e2e/
.PHONY: e2e-cr

## -- Front-end

build-front: ## Build front application
build-front: \
	build-ts \
	build-sass
.PHONY: build-front

build-sass: ## Build Sass file to CSS
	@$(YARN) workspace marsha run build-sass
.PHONY: build-sass

build-ts: ### Build TypeScript application
	@$(YARN) workspace marsha run compile-translations
	@$(YARN) build-lti
.PHONY: build-ts

watch-front: ## Build front application and activate watch mode
	@$(YARN) build-lti --watch
.PHONY: watch-front

clean-front: ## Clean front application modules
	rm -rf src/frontend/node_modules
	rm -rf src/frontend/apps/lti_site/node_modules
	rm -rf src/frontend/apps/standalone_site/node_modules
	rm -rf src/frontend/packages/lib_*/node_modules
	rm -rf src/frontend/packages/eslint-config-marsha/node_modules
	rm -rf src/frontend/packages/marsha-config/node_modules
.PHONY: clean-front

## -- Webtorent

install-webtorrent: ## Build node webtorrent dependencies
	@$(COMPOSE_RUN) webtorrent yarn install
.PHONY: install-webtorrent

## -- AWS

lambda-install-dev-dependencies: ## Install all lambda dependencies
lambda-install-dev-dependencies: \
	lambda-install-dev-dependencies-complete \
	lambda-install-dev-dependencies-configure \
	lambda-install-dev-dependencies-convert \
	lambda-install-dev-dependencies-medialive \
	lambda-install-dev-dependencies-mediapackage \
	lambda-install-dev-dependencies-elemental-routing \
	lambda-install-dev-dependencies-migrate
.PHONY: lambda-install-dev-dependencies

lambda-install-dev-dependencies-complete: ## Install dependencies for lambda complete
	@$(COMPOSE_RUN_LAMBDA) lambda_complete yarn install
.PHONY: lambda-install-dev-dependencies-convert

lambda-install-dev-dependencies-configure: ## Install dependencies for lambda configure
	@$(COMPOSE_RUN_LAMBDA) lambda_configure yarn install
.PHONY: lambda-install-dev-dependencies-configure

lambda-install-dev-dependencies-convert: ## Install dependencies for lambda convert
	@$(COMPOSE_RUN_LAMBDA) lambda_convert yarn install
.PHONY: lambda-install-dev-dependencies-convert

lambda-install-dev-dependencies-medialive: ## Install dependencies for lambda medialive
	@$(COMPOSE_RUN_LAMBDA) lambda_medialive yarn install
.PHONY: lambda-install-dev-dependencies-medialive

lambda-install-dev-dependencies-mediapackage: ## Install dependencies for lambda mediapackage
	@$(COMPOSE_RUN_LAMBDA) lambda_mediapackage yarn install
.PHONY: lambda-install-dev-dependencies-mediapackage

lambda-install-dev-dependencies-elemental-routing: ## Install dependencies for lambda elemental routing
	@$(COMPOSE_RUN_LAMBDA) lambda_elemental_routing yarn install
.PHONY: lambda-install-dev-dependencies-elemental-routing

lambda-install-dev-dependencies-migrate: ## Install dependencies for lambda migrate
	@$(COMPOSE_RUN_LAMBDA) lambda_migrate yarn install
.PHONY: lambda-install-dev-dependencies-migrate

test-lambda: ## Run all aws lambda tests
test-lambda: \
	test-lambda-complete \
	test-lambda-configure \
	test-lambda-convert \
	test-lambda-medialive \
	test-lambda-mediapackage \
	test-lambda-elemental-routing \
	test-lambda-migrate
.PHONY: test-lambda

test-lambda-complete: ## test aws lambda complete
	@$(COMPOSE_RUN_LAMBDA) lambda_complete yarn test
.PHONY: test-lambda-complete

test-lambda-configure: ## test aws lambda configure
	@$(COMPOSE_RUN_LAMBDA) lambda_configure yarn test
.PHONY: test-lambda-configure

test-lambda-convert: ## test aws lambda convert
	@$(COMPOSE_RUN_LAMBDA) lambda_convert yarn test
.PHONY: test-lambda-convert

test-lambda-medialive: ## test aws lambda medialive
	@$(COMPOSE_RUN_LAMBDA) lambda_medialive yarn test
.PHONY: test-lambda-medialive

test-lambda-mediapackage: ## test aws lambda mediapackage
	@$(COMPOSE_RUN_LAMBDA) lambda_mediapackage yarn test
.PHONY: test-lambda-mediapackage

test-lambda-elemental-routing: ## test aws lambda elemental routing
	@$(COMPOSE_RUN_LAMBDA) lambda_elemental_routing yarn test
.PHONY: test-lambda-elemental-routing

test-lambda-migrate: ## test aws lambda migrate
	@$(COMPOSE_RUN_LAMBDA) lambda_migrate yarn test
.PHONY: test-lambda-migrate

lint-lambda: ## Run linter an all lambda functions
lint-lambda: \
	lint-lambda-complete \
	lint-lambda-configure \
	lint-lambda-convert \
	lint-lambda-medialive \
	lint-lambda-mediapackage \
	lint-lambda-elemental-routing \
	lint-lambda-migrate
.PHONY: lint-lambda

lint-lambda-complete: ## run linter on lambda complete function
	@$(COMPOSE_RUN_LAMBDA) lambda_complete yarn lint
.PHONY: lint-lambda-complete

lint-lambda-configure: ## run linter on lambda configure function
	@$(COMPOSE_RUN_LAMBDA) lambda_configure yarn lint
.PHONY: lint-lambda-configure

lint-lambda-convert: ## run linter on lambda convert function
	@$(COMPOSE_RUN_LAMBDA) lambda_convert yarn lint
.PHONY: lint-lambda-convert

lint-lambda-medialive: ## run linter on lambda medialive function
	@$(COMPOSE_RUN_LAMBDA) lambda_medialive yarn lint
.PHONY: lint-lambda-medialive

lint-lambda-mediapackage: ## run linter on lambda mediapackage function
	@$(COMPOSE_RUN_LAMBDA) lambda_mediapackage yarn lint
.PHONY: lint-lambda-mediapackage

lint-lambda-elemental-routing: ## run linter on lambda elemental routing function
	@$(COMPOSE_RUN_LAMBDA) lambda_elemental_routing yarn lint
.PHONY: lint-lambda-elemental-routing

lint-lambda-migrate: ## run linter on lambda complete function
	@$(COMPOSE_RUN_LAMBDA) lambda_migrate yarn lint
.PHONY: lint-lambda-migrate

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
	@$(COMPOSE_RUN_APP) python manage.py makemessages --ignore "venv/**/*" --keep-pot --all
.PHONY: i18n-generate-back

i18n-generate-front:
	@$(YARN) workspace marsha run build
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

# -- Mail generator
install-mails: ## mail-generator yarn install 
	@$(COMPOSE_RUN_MAIL) install
.PHONY: install-mails 	

build-mails: ## Convert mjml files to html and text
	@$(COMPOSE_RUN_MAIL) build-mails
.PHONY: build-mails 

build-mjml-to-html:	## Convert mjml files to html and text
	@$(COMPOSE_RUN_MAIL) build-mjml-to-html
.PHONY: build-mjml-to-html 

build-mails-html-to-plain-text: ## Convert html files to text
	@$(COMPOSE_RUN_MAIL) build-mails-html-to-plain-text
.PHONY: build-mails-html-to-plain-text

# -- Misc

env.d/development:
	cp env.d/development.dist env.d/development
	
env.d/localtunnel:
	cp env.d/localtunnel.dist env.d/localtunnel

env.d/lambda:
	cp env.d/lambda.dist env.d/lambda

h: # short default help task
	@echo "$(BOLD)Marsha Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-50s$(RESET) %s\n", $$1, $$2}'
.PHONY: h

help:  ## Show a more readable help on multiple lines
	@echo "$(BOLD)Marsha Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%s$(RESET)\n    %s\n\n", $$1, $$2}'
.PHONY: help
