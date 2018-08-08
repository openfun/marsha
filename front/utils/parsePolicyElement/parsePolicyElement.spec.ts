import { parsePolicyElement } from './parsePolicyElement';

test('parsePolicyElement() returns an aws policy from a policy element that encodes it using data-attributes', () => {
  // Make a standard AWS S3 policy
  const policy: { [key: string]: string } = {
    acl: 'public-read',
    awsaccesskeyid: 'MyAWSKey',
    key: 'file_key_in_s3',
    policy: 'base64_encoded_policy',
    signature: 'the_policys_hmac_signature',
    url: 'my_s3_buckets_url',
  };
  // Set up the element that contains the policy as data-attributes
  const policyElement = document.createElement('div');
  Object.keys(policy).forEach(key =>
    policyElement.setAttribute(`data-${key}`, policy[key]),
  );
  // The policy is extracted from the policy element
  expect(parsePolicyElement(policyElement)).toEqual(policy);
});
