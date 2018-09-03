'use strict';

const expect = require('chai').expect;
const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('./media-convert.js');

describe('Media Convert', () => {
  afterEach(() => AWS.restore('MediaConvert'));

  it('should return data when getting endpoint', done => {
    const data = {
      Endpoints: [{ Url: 'https://test.mediaconvert.eu-west-1.amazonaws.com' }],
    };

    AWS.mock('MediaConvert', 'describeEndpoints', callback =>
      callback(null, data),
    );

    lambda.MediaConvertEndPoint().then(data => {
      expect(data.EndpointUrl).to.equal(
        'https://test.mediaconvert.eu-west-1.amazonaws.com',
      );
      done();
    });
  });

  it('should return data when creating presets', done => {
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

    lambda
      .MediaConvertPresets(event)
      .then(data => {
        expect(data).to.deep.equal({ Presets: Array.from(Array(11).keys()) });
        done();
      })
      .catch(err => done(err));
  });

  it('should update existing presets', done => {
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

    lambda
      .MediaConvertPresets(event)
      .then(data => {
        expect(data).to.deep.equal({ Presets: Array.from(Array(11).keys()) });
        done();
      })
      .catch(err => done(err));
  });
});
