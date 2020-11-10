default: help

env.d/development:
	cp env.d/development.dist env.d/development

apply: ## Apply terraform plan
	@bin/terraform apply
.PHONY: apply

apply-shared-resources: ## Apply terraform plan for shared resources
	@bin/shared-resources apply
.PHONY: apply-shared-resources

deploy: ## Create or update the complete AWS infrastructure for Marsha
deploy: \
	lambda \
	apply
.PHONY: deploy

deploy-shared-resources: ## Create or update shared resources on AWS
deploy-shared-resources: \
	lambda-shared-resources \
	apply-shared-resources
.PHONY: deploy-shared-resources

apply-all: ## Create or update all terraform plan
apply-all: \
	apply \
	apply-shared-resources
.PHONY: apply-all

output: ## Display Terraform config output
	bin/terraform output
.PHONY: output

init: env.d/development ## Initialize Terraform
init:
	bin/terraform init
	bin/shared-resources init
.PHONY: init

lambda-shared-resources: ## Zip and copy source files for shared resources to dist/
	@echo "Zip and copy source files for shared resources to dist/"
	@mkdir -p dist/
	@for lambda_name in medialive-routing; do \
		rm dist/marsha_$$lambda_name.zip ; \
		cd lambda-$$lambda_name ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 bash -c "rm -rf node_modules; yarn install --frozen-lockfile --production=true" ; \
		zip -q -r9 ../dist/marsha_$$lambda_name.zip *; \
		cd - ; \
	done
.PHONY:lambda-shared-resources

lambda: ## Zip and copy source files to dist/
	@echo "Zip and copy source files to dist/"
	@mkdir -p dist/
	@for lambda_name in migrate configure encode complete medialive; do \
		rm dist/marsha_$$lambda_name.zip ; \
		cd ./lambda-$$lambda_name ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 bash -c "rm -rf node_modules; yarn install --frozen-lockfile --production=true" ; \
		zip -q -r9 ../dist/marsha_$$lambda_name.zip *; \
		cd - ; \
	done
.PHONY: lambda

test: ## test all lambda packages
	@echo "Test all lambda packages"
	@for lambda_name in migrate configure encode complete medialive medialive-routing; do \
		cd ./lambda-$$lambda_name ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 bash -c "rm -rf node_modules; yarn install --frozen-lockfile" ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 yarn test ; \
		cd - ; \
	done
.PHONY: test

help:  ## Show this help
	@echo "$(BOLD)Marsha Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -h ':\s\+##' Makefile | column -tn -s# | awk -F ":" '{ print "  $(BOLD)" $$1 "$(RESET)" $$2 }'
.PHONY: help
