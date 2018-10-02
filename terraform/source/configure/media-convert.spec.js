'use strict';

const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

const lambda = require('./media-convert.js');

describe('Media Convert', () => {
  beforeEach(() => console.log.mockReset());

  afterEach(() => AWS.restore('MediaConvert'));

  it('returns data when its gets an endpoint', async () => {
    const data = {
      Endpoints: [{ Url: 'https://test.mediaconvert.eu-west-1.amazonaws.com' }],
    };

    AWS.mock('MediaConvert', 'describeEndpoints', callback =>
      callback(null, data),
    );

    const result = await lambda.MediaConvertEndPoint();
    expect(result.EndpointUrl).toEqual(
      'https://test.mediaconvert.eu-west-1.amazonaws.com',
    );
  });

  it('returns data when it creates presets', async () => {
    process.env.ENV_TYPE = 'test';
    const event = {
      EndPoint: 'https://test.mediaconvert.eu-west-1.amazonaws.com',
    };

    // Mock the function that gets presets to fake all new presets
    AWS.mock('MediaConvert', 'getPreset', (params, callback) =>
      callback('Preset does not exist'),
    );

    // Mock the function that creates presets and return a different name
    // for the preset each time it is called
    let callCount = 0;
    AWS.mock('MediaConvert', 'createPreset', (params, callback) =>
      callback(null, { Preset: { Name: callCount++ } }),
    );

    const result = await lambda.MediaConvertPresets(event);
    expect(result).toEqual({ Presets: Array.from(Array(21).keys()) });
  });

  it('updates existing presets', async () => {
    process.env.ENV_TYPE = 'test';
    const event = {
      EndPoint: 'https://test.mediaconvert.eu-west-1.amazonaws.com',
    };

    // Mock the function that gets presets to fake all existing presets
    AWS.mock('MediaConvert', 'getPreset', (params, callback) =>
      callback(null, {}),
    );

    // Mock the function that updates presets and return a different name
    // for the preset each time it is called
    let callCount = 0;
    AWS.mock('MediaConvert', 'updatePreset', (params, callback) =>
      callback(null, { Preset: { Name: callCount++ } }),
    );

    const result = await lambda.MediaConvertPresets(event);
    expect(result).toEqual({ Presets: Array.from(Array(21).keys()) });
  });
});
