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
	docker-compose run --rm app /bin/terraform init -backend-config="env.d/terraform_state"

.PHONY: destroy
destroy: ## Destroy Terraform config
destroy:
	docker-compose run --rm app /bin/terraform destroy

.PHONY: lambda
lambda: ## Zip and copy source files to dist/
lambda:
	@echo "Zip and copy source files to dist/"
	@rm -rf dist && mkdir dist
	@for lambda in configure encode update_state ; do \
		cd ./source/$$lambda ; \
		rm -rf node_modules ; \
		yarn install --frozen-lockfile --production=true ; \
		zip -q -r9 ../../dist/marsha_$$lambda.zip *; \
		cd - ; \
	done

.PHONY: test
test: ## test all lambda packages
test:
	@echo "Test all lambda packages"
	@for lambda in configure encode update_state ; do \
		cd ./source/$$lambda ; \
		rm -rf node_modules ; \
		yarn install --frozen-lockfile ; \
		yarn test; \
		cd - ; \
	done
