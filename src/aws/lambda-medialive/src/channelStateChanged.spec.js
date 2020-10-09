'use strict';
const marshaUrl = 'https://marsha.tld';
process.env.DISABLE_SSL_VALIDATION = 'false';
process.env.MARSHA_URL = marshaUrl;
process.env.SHARED_SECRET = 'some secret';

const mockSendRequest = jest.fn();
const mockComputeSignature = jest.fn();
jest.doMock('update-state/utils', () => ({
  computeSignature: mockComputeSignature,
  sendRequest: mockSendRequest,
}));

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockDescribeChannel = jest.fn();
jest.mock('aws-sdk', () => ({
  MediaLive: function() {
    this.describeChannel = mockDescribeChannel;
  },
}));

const channelStateChanged = require('./channelStateChanged');

describe('src/channel_state_changed', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('receives an unhandled status and throws an error', async () => {
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

    try {
      await channelStateChanged(event);
    } catch (error) {
      expect(error.message).toEqual('Expected status are RUNNING and STOPPED. STARTING received');
    }

    expect(mockDescribeChannel).not.toHaveBeenCalled();
    expect(mockComputeSignature).not.toHaveBeenCalled();
    expect(mockSendRequest).not.toHaveBeenCalled();
  });

  it('receives a RUNNING event and updates live state', async () => {
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
        "state": 'RUNNING',
        "message": "Created channel",
        "pipelines_running_count": 0
      }
    };

    mockDescribeChannel.mockReturnValue({
      promise: () =>
        new Promise(resolve => resolve({ Name: 'video-id_stamp' })),
    });
    mockComputeSignature.mockReturnValue('foo');
    const expectedBody = {state: 'running'};

    await channelStateChanged(event);

    expect(mockComputeSignature).toHaveBeenCalledWith(
      'some secret', 
      JSON.stringify(expectedBody)
    );
    expect(mockSendRequest).toHaveBeenCalledWith(
      expectedBody,
      'foo',
      false,
      `${marshaUrl}/api/videos/video-id/update-live-state/`,
      'PATCH'
    )
    expect(mockDescribeChannel).toHaveBeenCalledWith({ ChannelId: '1234567' });

  });

  it('receives a STOPPED event and updates live state', async () => {
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
        "state": 'STOPPED',
        "message": "Created channel",
        "pipelines_running_count": 0
      }
    };

    mockDescribeChannel.mockReturnValue({
      promise: () =>
        new Promise(resolve => resolve({ Name: 'video-id_stamp' })),
    });
    mockComputeSignature.mockReturnValue('foo');
    const expectedBody = {state: 'stopped'};

    await channelStateChanged(event);

    expect(mockComputeSignature).toHaveBeenCalledWith(
      'some secret', 
      JSON.stringify(expectedBody)
    );
    expect(mockSendRequest).toHaveBeenCalledWith(
      expectedBody,
      'foo',
      false,
      `${marshaUrl}/api/videos/video-id/update-live-state/`,
      'PATCH'
    )
    expect(mockDescribeChannel).toHaveBeenCalledWith({ ChannelId: '1234567' });

  });
});
