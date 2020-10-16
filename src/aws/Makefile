default: help

help: ## Show this help
  @grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help

env.d/development:
	cp env.d/development.dist env.d/development

apply: ## Apply terraform plan
	@bin/terraform apply
.PHONY: apply

deploy: ## Create or update the complete AWS infrastructure for Marsha
deploy: \
	lambda \
	apply
.PHONY: deploy

output: ## Display Terraform config output
	bin/terraform output
.PHONY: output

init: env.d/development ## Initialize Terraform
init:
	bin/terraform init
.PHONY: init

lambda: ## Zip and copy source files to dist/
	@echo "Zip and copy source files to dist/"
	@rm -rf dist && mkdir dist
	@for lambda_name in migrate configure encode complete medialive medialive-routing; do \
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
