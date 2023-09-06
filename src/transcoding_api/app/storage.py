from storages.backends.s3boto3 import S3Boto3Storage


class MyVideoStorage(S3Boto3Storage):
    bucket_name = "dev-henri-marsha-source-development"
