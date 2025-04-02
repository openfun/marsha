# Upgrade

All instructions to upgrade this project from one release to the next will be
documented in this file. Upgrades must be run sequentially, meaning you should
not skip minor/major releases while upgrading (fix releases can be skipped).

The format is inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### 5.7.x to 5.8.0

Environment variables previously prefixed with `DJANGO_VIDEOS_STORAGE_` are now prefixed with `DJANGO_STORAGE_`. Make sure to update your configuration accordingly.

### 4.2.x to 4.3.0

`DJANGO_STATICFILES_STORAGE` environment variable is not used anymore. You have to replace it by `DJANGO_STORAGES_STATICFILES_BACKEND`.

## 3.27.x to 4.0.x

### Before deploying

First you have to install `hashicorp/tls` provider by running `./bin/terraform init` in the `src/aws` directory.

Then the new terraform plan must be applied:

```bash
$ cd src/aws
$ make apply
```

Once done, a new ssh key pair has been generated. The public key is in the cloudfront management public keys and you have to use the corresponding ssh private key in your marsha installation. You have to retrieve it and replace your actual ssh private key by this one.

```bash
$ ./bin/terraform output cloudfront_ssh_private_key
```

You also have to remove the `DJANGO_CLOUDFRONT_ACCESS_KEY_ID` environment variable and add the new one `DJANGO_CLOUDFRONT_SIGNED_PUBLIC_KEY_ID`. It's value can be retrieve in the terraform output:

```bash
$ /bin/terraform output cloudfront_publick_key_id
```

## 3.0.0 to 3.1.0

### After deploying

- If you run the AWS migration, remove the variable `TF_VAR_migrations`,

### Before deploying


- An AWS migration should be run. This migration escapes all existing timed text
  tracks in the source bucket. This migration is called `0001_encode_timed_text_tracks` and you
  should set the environment variable `TF_VAR_migrations` with the value
  `0001_encode_timed_text_tracks`.
- Deploy first the AWS stack using terraform.

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
