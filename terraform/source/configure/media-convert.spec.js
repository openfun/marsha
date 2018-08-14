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
    const event = {
      EndPoint: 'https://test.mediaconvert.eu-west-1.amazonaws.com',
    };

    // Mock the function that create presets and return a different name
    // for the preset time it is called
    let callCount = 0;
    AWS.mock('MediaConvert', 'createPreset', (params, callback) =>
      callback(null, { Preset: { Name: callCount++ } }),
    );

    lambda
      .MediaConvertPresets(event)
      .then(data => {
        expect(data).to.deep.equal({ Presets: Array.from(Array(10).keys()) });
        done();
      })
      .catch(err => done(err));
  });
});
