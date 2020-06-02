default: help

.PHONY : help
help:  ## Show this help
	@echo "$(BOLD)FUN AWS Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -h ':\s\+##' Makefile | column -tn -s# | awk -F ":" '{ print "  $(BOLD)" $$1 "$(RESET)" $$2 }'

env.d/development:
	cp env.d/development.dist env.d/development

.PHONY: deploy
deploy: ## Create or update the complete AWS infrastructure for Marsha
deploy:
	@${MAKE} lambda
	@bin/terraform apply

.PHONY: output
output: ## Display Terraform config output
output:
	bin/terraform output

.PHONY: init
init: env.d/development ## Initialize Terraform
init:
	bin/terraform init

.PHONY: lambda
lambda: ## Zip and copy source files to dist/
lambda:
	@echo "Zip and copy source files to dist/"
	@rm -rf dist && mkdir dist
	@for lambda_name in migrate configure encode complete; do \
		cd ./lambda-$$lambda_name ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 bash -c "rm -rf node_modules; yarn install --frozen-lockfile --production=true" ; \
		zip -q -r9 ../dist/marsha_$$lambda_name.zip *; \
		cd - ; \
	done

.PHONY: test
test: ## test all lambda packages
test:
	@echo "Test all lambda packages"
	@for lambda_name in migrate configure encode complete; do \
		cd ./lambda-$$lambda_name ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 bash -c "rm -rf node_modules; yarn install --frozen-lockfile" ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/lambda-$$lambda_name" node:10 yarn test ; \
		cd - ; \
	done
