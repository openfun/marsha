# Upgrade

All instructions to upgrade this project from one release to the next will be
documented in this file. Upgrades must be run sequentially, meaning you should
not skip minor/major releases while upgrading (fix releases can be skipped).

The format is inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
