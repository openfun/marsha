export interface AWSPolicy {
  acl: string;
  bucket: string;
  key: string;
  policy: string;
  s3_endpoint: string;
  x_amz_algorithm: string;
  x_amz_credential: string;
  x_amz_date: string;
  x_amz_expires: string;
  x_amz_signature: string;
}

export interface AWSPresignedPost {
  fields: {
    [key: string]: string;
  };
  url: string;
}
