'use strict';

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, 'log');

process.env.MEDIALIVE_LAMBDA_NAME = 'medialive-lambda';

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockDescribeChannel = jest.fn();
const mockInvokeAsync = jest.fn();
jest.mock('aws-sdk', () => ({
  MediaLive: function() {
    this.describeChannel = mockDescribeChannel;
  },
  Lambda: function() {
    this.invokeAsync = mockInvokeAsync
  },
}));

const lambda = require('./index.js').handler;

describe('lambda', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('invokes a medialive lambda', async () => {
    const event = {
      "version": "0",
      "id": "0495e5eb-9b99-56f2-7849-96389238fb55",
      "detail-type": "MediaLive Channel State Change",
      "source": "aws.medialive",
      "account": "account_id",
      "time": "2020-06-15T15:18:29Z",
      "region": "eu-west-1",
      "resources": [
        "arn:aws:medialive:eu-west-1:account_id:channel:1234567"
      ],
      "detail": {
        "channel_arn": "arn:aws:medialive:eu-west-1:account_id:channel:1234567",
        "state": "STARTING",
        "message": "Created channel",
        "pipelines_running_count": 0
      }
    };

    mockDescribeChannel.mockReturnValue({
      promise: () =>
        new Promise(resolve => resolve({
          Name: 'medialive-name',
          Tags: { 
            environment: 'test' 
          }, 
        })),
    });

    mockInvokeAsync.mockReturnValue({
      promise: () => jest.fn(),
    });

    await lambda(event);

    expect(mockDescribeChannel).toHaveBeenCalledWith({ ChannelId: '1234567' });
    expect(mockInvokeAsync).toHaveBeenCalledWith({
      FunctionName: 'test-medialive-lambda',
      InvokeArgs: JSON.stringify({
        channel: {
          Name: 'medialive-name',
          Tags: { 
            environment: 'test' 
          }, 
        },
        event_origin: event
      })
    })
  });
});
