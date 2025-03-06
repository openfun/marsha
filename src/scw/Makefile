default: help

env.d/development:
	cp env.d/development.dist env.d/development

apply: ## Apply terraform plan
	@bin/terraform apply
.PHONY: apply

deploy: ## Create or update the complete SCW infrastructure for Marsha
deploy: \
	function \
	apply
.PHONY: deploy

apply-all: ## Create or update all terraform plan
apply-all: \
	apply
.PHONY: apply-all

output: ## Display Terraform config output
	bin/terraform output
.PHONY: output

init: env.d/development ## Initialize Terraform
init:
	bin/terraform init
	bin/shared-resources init
.PHONY: init

function: ## Zip and copy source files to dist/
	@echo "Zip and copy source files to dist/"
	@mkdir -p dist/
	@for function_name in transfer; do \
		rm dist/marsha_$$function_name.zip ; \
		cd ./function-$$function_name ; \
		docker run --rm -it -v "${PWD}:/app" -w "/app/function-$$function_name" node:18 bash -c "rm -rf node_modules; yarn install --frozen-lockfile --production=true" ; \
		zip -q -r9 ../dist/marsha_$$function_name.zip *; \
		cd - ; \
	done
.PHONY: function
