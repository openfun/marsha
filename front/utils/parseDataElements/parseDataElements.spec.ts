import { keyFromAttr, parseDataElements } from './parseDataElements';

test('keyFromAttr() drops "data-" from the attribute name and camel-cases it', () => {
  expect(keyFromAttr('data-example')).toEqual('example');
  expect(keyFromAttr('data-split-name')).toEqual('splitName');
});

test('parseDataElements() returns an object from the key/values of a data-element', () => {
  // Build some bogus object with string values & lowecase string keys
  const data: { [key: string]: string } = {
    keyone: 'valueOne',
    keytwo: 'valueTwo',
  };
  // Set up the element that contains our data as data-attributes
  const dataElement = document.createElement('div');
  Object.keys(data).forEach(key =>
    dataElement.setAttribute(`data-${key}`, data[key]),
  );
  // The data is extracted from the data element
  expect(parseDataElements([dataElement])).toEqual(data);
});

test('parseDataElements() merges data from two separate elements', () => {
  // Build some bogus objects with string values & lowecase string keys
  const dataX: { [key: string]: string } = {
    keythree: 'valueThree',
  };
  const dataY: { [key: string]: string } = {
    keyfour: 'valueFour',
  };
  // Set up the elements that contains our data as data-attributes
  const dataElementX = document.createElement('div');
  Object.keys(dataX).forEach(key =>
    dataElementX.setAttribute(`data-${key}`, dataX[key]),
  );
  const dataElementY = document.createElement('div');
  Object.keys(dataY).forEach(key =>
    dataElementY.setAttribute(`data-${key}`, dataY[key]),
  ); // The data is extracted from the data element
  expect(parseDataElements([dataElementX, dataElementY])).toEqual({
    ...dataX,
    ...dataY,
  });
});

test('parseDataElements() creates a nested object when an element as an ID attribute', () => {
  // Build some bogus objects with string values & lowecase string keys
  const data: { [data: string]: string } = {
    keyfive: 'valueFive',
  };
  // Make a standard AWS S3 policy for illustration purposes
  const policy: { [key: string]: string } = {
    acl: 'public-read',
    awsaccesskeyid: 'MyAWSKey',
    key: 'file_key_in_s3',
    policy: 'base64_encoded_policy',
    signature: 'the_policys_hmac_signature',
    url: 'my_s3_buckets_url',
  };
  // Set up the element that contains our bogus data as data-attributes
  const dataElement = document.createElement('div');
  Object.keys(data).forEach(key =>
    dataElement.setAttribute(`data-${key}`, data[key]),
  );
  // Set up the element that contains the policy as data-attributes
  const policyElement = document.createElement('div');
  policyElement.id = 'policy'; // triggers the creation of a nested object
  Object.keys(policy).forEach(key =>
    policyElement.setAttribute(`data-${key}`, policy[key]),
  );
  // The bogus data and policy are extracted from the data elements
  expect(parseDataElements([dataElement, policyElement])).toEqual({
    ...data,
    policy,
  });
});
