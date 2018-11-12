# Environment variables

`marsha` contains several projects, three of which are configured through environment variables.

First, there is our Django backend. We try to follow [12 factors app](https://12factor.net/) and so use environment variables for configuration. It looks for environment variables in `env.d/{environment}`.

Then, there is our AWS deployment configurations in the `src/aws` folder:

- The main Terraform project in charge of deploying Marsha looks for environment variables in `src/aws/env.d/{environment}`,
- A small side Terraform project located in `src/aws/create_state_bucket` is responsible just for creating an S3 bucket in AWS that Terraform will use to record the state of the main Marsha project with encryption and versioning. This Terraform project looks for environment variables in `src/aws/env.d/state_bucket`.

## 1. Django backend environment

Specified in `{REPO_ROOT}/env.d/{environment}`.

### General Django settings

#### DJANGO_ALLOWED_HOSTS

A string of comma separated domains that Django should accept and answer to. See [Django documentation](https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts) for more details about this setting.

- Type: String
- Required: Varies depending on the environment.
  - No in development, this setting is not available and its value is forced to accept any originating domain;
  - Yes otherwise.
- Default: Varies depending on the environment.
  - ["*"] in development: all originating domains are accepted;
  - None otherwise: all originating domains are rejected.

#### DJANGO_CONFIGURATION

Define the environment in which the application should run. It conditions which version of the settings will be loaded.

- Type: `String`
- Required: Yes
- Default: `Development`
- Choices: One of `Development`, `Test`, `Staging`, `Preprod` or `Production`.

#### DJANGO_DEBUG

Turns on/off debug mode.

- Type: Boolean
- Required: No
- Default: `True` if `DJANGO_CONFIGURATION` is set to `Development`, `False` otherwise
- Choices: `True` or `False`

#### DJANGO_SECRET_KEY

Standard Django secret key used to make the instance unique and generate hashes such as CSRF tokens or auth keys.

See [Django documentation](https://docs.djangoproject.com/en/dev/ref/settings/#secret-key) for more information about this setting.

- Type: String
- Required: Yes
- Default: None

#### DJANGO_SETTINGS_MODULE

Define the settings file to use, relative to `src/backend`.

- Type: `String`
- Required: Yes
- Default: `marsha.settings`
- Choices: Must be set to `marsha.settings`.

### Marsha specific settings

#### DJANGO_BYPASS_LTI_VERIFICATION

Whether to skip all LTI-related checks and accept all requests on LTI endpoints as valid. This is useful for development but should never be set to `True` on publicly accessible deployments.

Note: Can't be set to `True` unless `DJANGO_DEBUG` is `True` too.

- Type: Boolean
- Required: No
- Default: `False`
- Choices: `True` or `False`

#### DJANGO_JWT_SIGNING_KEY

Secret key used to sign JWTs. Those are used to communicate between the Django backend and authenticated third parties (including the frontend).

- Type: string
- Required: Yes
- Default: `DJANGO_SECRET_KEY`. The SIGNING_KEY setting defaults to the value of the SECRET_KEY setting for your django project. This is a reasonable default. We still recommend you change this setting to an indenpendent value so you can easily invalidate the tokens by changing the key if it becomes compromise.

#### DJANGO_SENTRY_DSN

Should be set to activate sentry for an environment. The value of this DSN is given when you add a project to your Sentry instance.

- Type: string
- Required: No
- Default: None

#### DJANGO_UPDATE_STATE_SHARED_SECRETS

Secrets used to sign messages sent to the Django backend from AWS lambdas (like state updates). This being a list lets us support 1 or more shared secrets — and 1 or more deployments — at the same time.

Note: should include the value from `TF_VAR_update_state_secret` in `src/aws` for any stack deployed to AWS which should communicate with the Django backend.

- Type: comma-separated list of strings
- Required: Yes
- Default: None

### Database-related settings

#### POSTGRES_DB

Name for the Postgres database used by Marsha.

- Type: string
- Required: No
- Default: `"marsha"`

#### POSTGRES_HOST

Address for the Postgres database used by Marsha.

- Type: string
- Required: No
- Default: `"localhost"`

#### POSTGRES_PASSWORD

Password corresponding to the user specified in `POSTGRES_USER`, for the Postgres database used by Marsha.

- Type: string
- Required: No
- Default: `"pass"`

#### POSTGRES_PORT

Port for the Postgres database used by Marsha.

- Type: number
- Required: No
- Default: `5432"`

#### POSTGRES_USER

User to connect to the Postgres database used by Marsha.

- Type: string
- Required: No
- Default: `"marsha_user"`

### Amazon Web Services-related settings

#### DJANGO_AWS_ACCESS_KEY_ID, DJANGO_AWS_SECRET_ACCESS_KEY

A key ID + secret pair for an AWS IAM account with administrative access to the resources the relevant AWS deployment is using.

- Type: string
- Required: Yes
- Default: None

#### DJANGO_AWS_DEFAULT_REGION

The Amazon Web Services region where we deployed or want to deploy our serverless stack.

- Type: string
- Required: No
- Default: `"eu-west-1"`
- Choices: Any valid AWS region name.

#### DJANGO_AWS_SOURCE_BUCKET_NAME

The source AWS S3 bucket where files will be uploaded by end users. This should match the name of the bucket created by the relevant AWS deployment.

- Type: string
- Required: No
- Default: Varies depending on the environment.
  - `"development-marsha-source"` in development;
  - `"test-marsha-source"` in test;
  - `"staging-marsha-source"` in staging;
  - `"preprod-marsha-source"` in preproduction;
  - `"production-marsha-source"` in production.

#### DJANGO_CLOUDFRONT_ACCESS_KEY_ID

The access key ID of the AWS master account (not its account id!) with which we want to sign urls (it is declared in the CloudFront distribution as a signing account).

Note: Must be associated with a master account as IAM accounts cannot sign URLs.

- Type: string
- Required:
  - Yes when `DJANGO_CLOUDFRONT_SIGNED_URLS_ACTIVE` is `True`;
  - No otherwise.
- Default: None;

#### CLOUDFRONT_PRIVATE_KEY_PATH

Path to a private key corresponding to the acess key ID in `DJANGO_CLOUDFRONT_ACCESS_KEY_ID`. Also used to sign Cloudfront URLs.

- Type: string
- Required:
  - Yes when `DJANGO_CLOUDFRONT_SIGNED_URLS_ACTIVE` is `True` and the key is not located in the default path;
  - No otherwise.
- Default: `src/backend/.ssh/cloudfront_private_key`

#### DJANGO_CLOUDFRONT_SIGNED_URLS_ACTIVE

Whether Cloudfront URLs for MP4 files and subtitle tracks should be cryptographically signed.

Note: Preview images are never signed as a matter of policy; adaptive streaming formats pose technical challenges when it comes to signed URLs, so we're not doing any signing there for now.

- Type: Boolean
- Required: No
- Default: Varies depending on the environment:
  - `False` in development and test;
  - `True` in all other environments.
- Choices: `True` or `False`

#### DJANGO_CLOUDFRONT_URL

The URL for the AWS Cloudfront distribution for the relevant AWS deployment. This is the domain that will be used to distribute processed files to end users.

- Type: string
- Required: Yes
- Default: None


## 2. Environment to deploy Marsha to AWS

Specified in `{REPO_ROOT}/src/aws/env.d/{environment}`.

#### AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

A key ID + secret pair for an AWS IAM account with administrative access to the resources the AWS deployment we're operating on is using.

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_aws_region

The Amazon Web Services region where we deployed or want to deploy our serverless stack.

- Type: string
- Required: No
- Default: `"eu-west-1"`
- Choices: Any valid AWS region name.

#### TF_VAR_cloudfront_trusted_signer_id

The ID of the AWS master account (not its access key!) with which we want to sign urls (it is declared in the CloudFront distribution as a signing account).

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_update_state_secret

Secret used to sign messages exchanged between the Django backend & AWS lambdas.

Note: should be included in the list of values declared in `DJANGO_UPDATE_STATE_SHARED_SECRETS` for the Django backend deployment with which our deployment's lambdas will communicate.

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_update_state_endpoint

URL of the endpoint in Marsha to which our lambdas should POST state updates when they process files.

Example: `https://example.com/api/update-state`.

- Type: string
- Required: Yes
- Default: None

## 3. Environment to create the state bucket in AWS

Specified in `{REPO_ROOT}/src/aws/env.d/state_bucket`.

#### AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

A key ID + secret pair for an AWS IAM account with administrative access to the resources we need to access to create the state bucket (see Terraform configuration files).

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_aws_region

The Amazon Web Services region where we deployed or want to deploy our state bucket.

- Type: string
- Required: No
- Default: `"eu-west-1"`
- Choices: Any valid AWS region name.
