default: help

.PHONY : help
help:  ## Show this help
	@echo "$(BOLD)FUN AWS Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -h ':\s\+##' Makefile | column -tn -s# | awk -F ":" '{ print "  $(BOLD)" $$1 "$(RESET)" $$2 }'

.PHONY: apply
apply: ## Apply Terraform config
apply:
	docker-compose run --rm app /bin/terraform apply

.PHONY: refresh
refresh: ## Refresh Terraform config
refresh:
	docker-compose run --rm app /bin/terraform refresh

.PHONY: state-create
state-create: ## Create bucket in AWS to store Terraform state files
state-create:
	docker-compose run --rm -w /app/create_state_bucket app /bin/terraform apply

.PHONY: state-output
state-output: ## Display output of the terraform state bucket creation
state-output:
	docker-compose run --rm -w /app/create_state_bucket app /bin/terraform output


.PHONY: deploy
deploy: ## Create or update the complete AWS infrastructure for Marsha
deploy:
	@${MAKE} lambda
	@${MAKE} apply

.PHONY: output
output: ## Display Terraform config output
output:
	docker-compose run --rm app /bin/terraform output

.PHONY: init
init: ## Initialize Terraform
init:
	docker-compose run --rm app /bin/terraform init

.PHONY: destroy
destroy: ## Destroy Terraform config
destroy:
	docker-compose run --rm app /bin/terraform destroy

.PHONY: lambda
lambda: ## Zip and copy source files to dist/
lambda:
	@echo "Zip and copy source files to dist/"
	@rm -rf dist && mkdir dist
	@find ./source -maxdepth 2  -name "node_modules" -exec rm -rf "{}" \;
	@cd ./source/configure && npm install --production && zip -q -r9 ../../dist/marsha_configure.zip *;
	@cd ./source/encode && npm install --production && zip -q -r9 ../../dist/marsha_encode.zip *;
	@cd ./source/confirm && npm install --production && zip -q -r9 ../../dist/marsha_confirm.zip *;

.PHONY: test
test: ## test all lambda packages
test:
	@echo "Test all lambda packages"
	@cd ./source/configure && npm install && npm test;
