default: help

env.d/development:
	cp env.d/development.dist env.d/development

apply: ## Apply terraform plan
	@bin/terraform apply
.PHONY: apply

apply-shared-resources: ## Apply terraform plan for shared resources
	@bin/shared-resources apply
.PHONY: apply-shared-resources

apply-all: ## Create or update all terraform plan
apply-all: \
	apply \
	apply-shared-resources
.PHONY: apply-all

destroy: ## Destroy terraform resources
	@bin/terraform destroy
.PHONY: destroy

destroy-shared-resources: ## Destroy terraform shared resources
	@bin/shared-resources destroy
.PHONY: destroy-shared-resources

destroy-all: ## Destroy all terraform resources
destroy-all: \
	destroy-shared-resources \
	destroy
.PHONY: destroy-all

output: ## Display Terraform config output
	bin/terraform output
.PHONY: output

init: env.d/development ## Initialize Terraform
init:
	bin/terraform init
	bin/shared-resources init
	bin/shared-resources apply -target aws_ecr_repository.marsha_lambda
.PHONY: init

help:  ## Show this help
	@echo "$(BOLD)Marsha Makefile$(RESET)"
	@echo "Please use 'make $(BOLD)target$(RESET)' where $(BOLD)target$(RESET) is one of:"
	@grep -h ':\s\+##' Makefile | column -tn -s# | awk -F ":" '{ print "  $(BOLD)" $$1 "$(RESET)" $$2 }'
.PHONY: help
