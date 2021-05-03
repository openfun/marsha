# Environment variables

`marsha` contains several projects, three of which are configured through environment variables.

First, there is our Django backend. We try to follow [12 factors app](https://12factor.net/) and so use environment variables for configuration. It looks for environment variables in `env.d/{environment}`.

Then, there is our AWS deployment configurations in the `src/aws` folder. Terraform looks for environment variables in `src/aws/env.d/{environment}`:

- A small side Terraform project located in `src/aws/create_state_bucket` is responsible just for creating an S3 bucket in AWS that Terraform will use to record the state of the main Marsha project with encryption and versioning.
- The main Terraform project in charge of deploying Marsha,

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

- Type: comma-separated list of strings <br> ⚠️ *ITEMS MUST NOT INCLUDE ANY COMMAS* as commas are used to separated items.
- Required: Yes
- Default: None

#### DJANGO_EXTERNAL_JAVASCRIPT_SCRIPTS

List of external javascript scripts to load in the LTI template. This list will be loaded after loading the main react script. This setting allows to load scripts hosted on another domain and specific to your project.

- Type: comma-separated list of strings <br> ⚠️ *ITEMS MUST NOT INCLUDE ANY COMMAS* as commas are used to separated items.
- Required: No
- Default: Empty list

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

#### APP_DATA_CACHE_DURATION

Cache expiration (in seconds) for application data passed to the frontend by LTI views.

- Type: number
- Required: No
- Default: 60


### Amazon Web Services-related settings

#### DJANGO_AWS_ACCESS_KEY_ID, DJANGO_AWS_SECRET_ACCESS_KEY

A key ID + secret pair for an AWS IAM account with administrative access to the resources the relevant AWS deployment is using.

- Type: string
- Required: Yes
- Default: None

#### DJANGO_AWS_S3_REGION_NAME

The Amazon Web Services region where we deployed or want to deploy our serverless stack.

- Type: string
- Required: No
- Default: `"eu-west-1"`
- Choices: Any valid AWS region name.

#### DJANGO_AWS_BASE_NAME

All the AWS services we use have their name prefixed by the terraform workspace name.
This setting should contain the terraform workspace name defined in marsha's AWS project.

- Type: string
- Required: No
- Default: Varies depending on the environment.
  - `"development"` in development;
  - `"test"` in test;
  - `"staging"` in staging;
  - `"preprod"` in preprod;
  - `"production"` in production.

#### DJANGO_AWS_SOURCE_BUCKET_NAME

The source AWS S3 bucket where files will be uploaded by end users. This should match the name of the bucket created by the relevant AWS deployment.

- Type: string
- Required: No
- Default: Varies depending on the environment.
  - `"development-marsha-source"` in development;
  - `"test-marsha-source"` in test;
  - `"staging-marsha-source"` in staging;
  - `"preprod-marsha-source"` in preprod;
  - `"production-marsha-source"` in production.

### DJANGO_AWS_STATIC_BUCKET_NAME

The AWS S3 bucket where static files will be uploaded by collectstatic. The development and test
environments do not store their static files to S3 but on the filesystem. This should match the
name of the bucket created by the relevant AWS deployment.

- Type: string
- Required: No
- Default: Varies depending on the environment:
  - `"staging-marsha-static"` in staging;
  - `"preprod-marsha-static"` in preprod;
  - `"production-marsha-static"` in production.

### DJANGO_STATICFILES_STORAGE

The static files storage backend that Django should use to serve static files. For more
information, see [documentation](https://docs.djangoproject.com/en/2.1/ref/contrib/staticfiles/#storages).

- Type: string
- Required: No
- Default: Varies depending on the environment:
  - `"django.contrib.staticfiles.storage.ManifestStaticFilesStorage"` in development and test
  - `"marsha.core.storage.ConfigurableManifestS3Boto3Storage"` in staging, preprod and
    production.

### DJANGO_STATICFILES_MANIFEST_NAME

The mapping between the names of the original static files and the names of the static files
distributed by the backend is stored in a file called the manifest.

This setting makes the manifest file name configurable so that it can be versioned with a deployment stamp in our CI/CD.

Indeed, we need to change the name of this manifest file for each deployment so that several
versions of the app can run in parallel without interfering with each other.

- Type: string
- Required: No
- Default: `staticfiles.json`

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

Whether Cloudfront URLs for MP4 files and timed text tracks should be cryptographically signed.

Note: Preview images are never signed as a matter of policy; adaptive streaming formats pose technical challenges when it comes to signed URLs, so we're not doing any signing there for now.

- Type: Boolean
- Required: No
- Default: Varies depending on the environment:
  - `False` in development and test;
  - `True` in all other environments.
- Choices: `True` or `False`

#### DJANGO_CLOUDFRONT_DOMAIN

The domain for the AWS Cloudfront distribution for the relevant AWS deployment. This is the domain
that will be used to distribute processed files to end users.

- Type: string
- Required: Yes
- Default: None

### XMPP settings

#### DJANGO_LIVE_CHAT_ENABLED

To enable or disable the global chat feature.

- Type: boolean
- Required: No
- Default: False

#### DJANGO_XMPP_DOMAIN

Main XMPP server domain.

- Type: string
- Required: Only when `DJANGO_LIVE_CHAT_ENABLED` is set to True
- Default: None

#### DJANGO_XMPP_BOSH_URL

The Bosh endpoint defined by your XMPP server. This url is used by Marsha's front application to excahnge with the XMPP server.
Required when `DJANGO_LIVE_CHAT_ENABLED` is set to True

- Type: string
- Required: Only when `DJANGO_LIVE_CHAT_ENABLED` is set to True
- Default: None

#### DJANGO_XMPP_CONFERENCE_DOMAIN

Your XMPP MUC component domain.

- Type: string
- Required: Only when `DJANGO_LIVE_CHAT_ENABLED` is set to True
- Default: None

#### DJANGO_XMPP_PRIVATE_ADMIN_JID

The JID of an admin configured on your XMPP server. Example: `admin@your-xmpp-server.com`

- Type: string
- Required: Only when `DJANGO_LIVE_CHAT_ENABLED` is set to True
- Default: None

#### DJANGO_XMPP_PRIVATE_SERVER_PORT

XMPP server port to use for client connections

- Type: number
- Required: No
- Default: 5222

#### DJANGO_XMPP_PRIVATE_SERVER_PASSWORD

The password associated to your admin user set in the setting `DJANGO_XMPP_PRIVATE_ADMIN_JID`

- Type: string
- Required: Only when `DJANGO_LIVE_CHAT_ENABLED` is set to True
- Default: None

#### DJANGO_XMPP_JWT_SHARED_SECRET

Secret key used to sign JWTs.

- Type: string
- Required: Only when `DJANGO_LIVE_CHAT_ENABLED` is set to True
- Default: None

#### DJANGO_XMPP_JWT_ISSUER

The JWT issuer accepted by the XMPP server

- Type: string
- Required: No
- Default: marsha

#### DJANGO_XMPP_JWT_AUDIENCE

The JWT audience accepted by the XMPP server

- Type: string
- Required: No
- Default: marsha

### Live settings

#### DJANGO_LIVE_PLAYLIST_WINDOW_SECONDS

Time window (in seconds) contained in each parent manifest.
https://docs.aws.amazon.com/mediapackage/latest/apireference/origin_endpoints.html#origin_endpoints-prop-hlspackage-playlistwindowseconds

- Type: integer
- Required: No
- Default: 10

#### DJANGO_LIVE_SEGMENT_DURATION_SECONDS

Duration (in seconds) of each fragment. Actual fragments are rounded to the nearest multiple of the source fragment duration. 
https://docs.aws.amazon.com/mediapackage/latest/apireference/origin_endpoints.html#origin_endpoints-prop-hlspackage-segmentdurationseconds

- Type: integer
- Required: No
- Default: 4

#### DJANGO_LIVE_FRAMERATE_NUMERATOR

Framerate numerator - framerate is a fraction, e.g. 24000 / 1001 = 23.976 fps.
https://docs.aws.amazon.com/medialive/latest/apireference/channels.html#channels-prop-h264settings-frameratenumerator

- Type: integer
- Required: No
- Default: 24000

#### DJANGO_LIVE_FRAMERATE_DENOMINATOR

Framerate denominator.
https://docs.aws.amazon.com/medialive/latest/apireference/channels.html#channels-prop-h264settings-frameratedenominator

- Type: integer
- Required: No
- Default: 1000

#### DJANGO_LIVE_GOP_SIZE

GOP size (keyframe interval) in units of either frames or seconds per gopSizeUnits. gopSize must be greater than 0, but need not be an integer.
https://docs.aws.amazon.com/medialive/latest/apireference/channels.html#channels-prop-h264settings-gopsize

- Type: number
- Required: No
- Default: 4

### Crowdin API access related settings

#### CROWDIN_API_KEY

The API access key provided by Crowdin. Only managers can have access to this key.

- Type: string
- Required: No
- Default: None

#### CROWDIN_PROJECT_ID

The unique project identifier provided by Crowdin. Only managers can have access to this setting.

- Type: string
- Required: No
- Default: None

#### CROWDIN_BASE_PATH

The path from where the `crowdin-cli` will work, this path should point to the `src` directory of marsha.

By default its value is `/app/src` and while you are using the container configured in our `docker-compose` file you have no need to change it.

- Type: string
- Required: None
- Default: /app/src


## 2. Environment to deploy Marsha to AWS

Specified in `{REPO_ROOT}/src/aws/env.d/{environment}`.

#### AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

A key ID + secret pair for an AWS IAM account with administrative access to the resources the AWS deployment we're operating on is using.

- Type: string
- Required: Yes
- Default: None

#### AWS_DEFAULT_REGION

The default region used by the AWS provider. All resources managed by terraform will be created on this region.

- Type: string
- Required: Yes
- Default: eu-west-1

#### TF_VAR_s3_bucket_unique_suffix

A unique suffix added to all S3 bucket names. You choose this suffix once and can't change it afterwards as it is not allowed to rename a bucket (terraform would delete the current bucket and create a new one. All your data would be lost for ever). This suffix is needed because a bucket name is unique accross all existing AWS accounts: https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
A suffix can be your company name or any random string. If you don't add this variable, you will not be able to create any s3 bucket in your project.

- Type: string
- Required: Yes

#### TF_VAR_cloudfront_trusted_signer_id

The ID of the AWS master account (not its access key!) with which we want to sign urls (it is declared in the CloudFront distribution as a signing account).

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_update_state_secret

Secret used to sign messages exchanged between the Django backend & AWS lambdas.

Note: should be included in the list of values declared in `DJANGO_UPDATE_STATE_SHARED_SECRETS` for the Django backend deployment with which our deployment's lambdas will communicate.

- Type: string <br> ⚠️ *MUST NOT INCLUDE ANY COMMAS* as the corresponding Django setting is a comma-separated list.
- Required: Yes
- Default: None

#### TF_VAR_marsha_base_url

The marsha backend url. This url will be used in the lambda as base url to build all the url called from all lambdas.

Example: `marsha.education`

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_update_state_endpoint

The endpoint in Marsha to which our lambdas should POST state updates when they process files.

Example: `/api/update-state`.

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_update_state_disable_ssl_validation

Whether SSL certificate validation in requests made by the AWS lambdas should be disabled. This allows Django to run on a domain with a self-signed or otherwise invalid certificate in non-production environments.

- Type: boolean
- Required: No
- Default: false

#### TF_VAR_migrations

A list of migrations to execute by the migration lambda without the extension (`.js`). List of migrations are available in `src/aws/lambda-migrate/src/migrations`.
To execute the migration `0001_encode_timed_text_tracks.js` set this variable with `0001_encode_timed_text_tracks`

Example: ["0001_encode_timed_text_tracks"]

- Type: list of strings
- Required: No
- Default: []

#### TF_VAR_lambda_image_name

The [ECR](https://aws.amazon.com/ecr/) image name you want to use. All lambdas are built in one docker image and hosted in this repository

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_lambda_image_tag

The lambda docker image tag used by all the lambdas

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_ecr_lambda_marsha_arn

The [arn](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) associated with the ECR image name.
This value can be found in the shared_resources terraform output.

- Type: string
- Required: Yes
- Default: None

#### TF_VAR_medialive_lambda_name

This variable is used by the medialive routing lambda. This lambda will use the variable to determine on which lambda
the event should be routed. 

- Type: string
- Required: Yes
- Default: marsha-medialive
