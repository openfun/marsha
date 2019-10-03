# Upgrade

All instructions to upgrade this project from one release to the next will be
documented in this file. Upgrades must be run sequentially, meaning you should
not skip minor/major releases while upgrading (fix releases can be skipped).

The format is inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 3.0.0 to 3.1.0

### After switching

- If before deploying you've added the `AWSLambdaRole` policy to your AWS user, you may now
  safely remove it.

### Before deploying

- new setting `AWS_BASE_NAME`. The value should be the terraform workspace name used to deploy
  all the AWS stack. For example if your workspace name is `production` set `AWS_BASE_NAME` to
  `production`
- AWS lambda-encode must be deployed before running Django migrations.
- A Django data migration will be run that will look to all existing timed text tracks in the
  S3 source bucket and trigger the marsha-encode lambda to escape them. If you don't want to
  run this migration you should set `SHOULD_RUN_TIMEDTEXT_TRACKS_ESCAPING_MIGRATION` setting
  to False. We want to warn that not running this migration is strongly discouraged and poses
  security threats as the content of the timed text tracks will now be displayed insecurely
  by React.
- The migration 0016 will invoke an AWS lambda. To achieve this migration, the AWS user you use
  in the project must have sufficient permissions to invoke lambdas. If it's not the case, you
  should assign him the `AWSLambdaRole` policy.

## 2.10.x to 3.0.x

### Before switching

- The deprecated route `/lti-video/` is removed. You must move all your existing
  link using this route to the route `/lti/videos/{id}` where `id` is the video id.
- The deprecated settings `DJANGO_LRS_URL`, `DJANGO_LRS_AUTH_TOKEN`, `DJANGO_LRS_XAPI_VERSION`
  are not used anymore. See migration from 2.6.x to 2.7.x
- Setting `STATICFILES_AWS_ENABLED` is not used anymore. Just delete it you have nothing more
  to do.

## 2.9.x to 2.10.x

Nothing to do

## 2.8.x to 2.9.x

Nothing to do

## 2.6.x to 2.7.x

### After switching

- LRS configuration is not made anymore in the settings. You should remove the environment
  variables `DJANGO_LRS_URL`, `DJANGO_LRS_AUTH_TOKEN`, `DJANGO_LRS_XAPI_VERSION` and configure
  your LRS credentials in the admin for each consumer_site you have.
  These settings will be removed in the next major release.

## 2.5.x to 2.6.x

### Before switching

- Static files are now hosted on AWS S3 by default and served via CloudFront.
  In order to make it work, you need to:
    * Create a new environment variable: `DJANGO_AWS_S3_REGION_NAME`
      (see [doc](./docs/env.md#django_aws_s3_region_name) for information about how
      to set this variable),
    * Create a new environment variable: `DJANGO_CLOUDFRONT_DOMAIN`
      (see [doc](./docs/env.md#django_cloudfront_domain) for information about how
      to set this variable),
    * Update your AWS stack to create the necessary buckets, CloudFront distribution
      and bucket policy. To do so, checkout the new release code and run:

        ```bash
        $ cd src/aws
        $ make deploy
        $ cd -
        ```
  If you prefer to continue hosting your static files on the file system, you need to
  create a new environment variable: `DJANGO_STATICFILES_STORAGE` and set it to:
  `django.contrib.staticfiles.storage.ManifestStaticFilesStorage`.
  (see [doc](./docs/env.md#django_staticfiles_storage) for information about how
  to set this variable).

- collect static files and run database migrations

    ```bash
    $ make collectstatic
    $ make migrate
    ```

### After switching

- Remove the `DJANGO_AWS_DEFAULT_REGION` environment variable.
- Remove the `DJANGO_CLOUDFRONT_URL` environment variable.
