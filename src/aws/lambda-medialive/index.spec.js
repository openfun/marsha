// Mock our own sub-modules to simplify our tests
const mockChannelStateChanged = jest.fn();
jest.doMock('./src/channelStateChanged', () => mockChannelStateChanged);

const lambda = require('./index.js').handler;

describe('lambda', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('calls channelStateChanged when a channel state changes', async () => {
    const event = {
      event_origin: {
        version: '0',
        id: '0495e5eb-9b99-56f2-7849-96389238fb55',
        'detail-type': 'MediaLive Channel State Change',
        source: 'aws.medialive',
        account: 'account_id',
        time: '2020-06-15T15:18:29Z',
        region: 'eu-west-1',
        resources: ['arn:aws:medialive:eu-west-1:account_id:channel:1234567'],
        detail: {
          channel_arn: 'arn:aws:medialive:eu-west-1:account_id:channel:1234567',
          state: 'RUNNING',
          message: 'Created channel',
          pipeline: '0',
          pipelines_running_count: 0,
        },
      },
      channel: {
        Name: 'video-id_stamp',
      },
    };

    const context = {
      awsRequestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      logGroupName: '/aws/lambda/dev-test-marsha-medialive',
    };

    mockChannelStateChanged.mockResolvedValue();

    await lambda(event, context);

    expect(mockChannelStateChanged).toHaveBeenCalledWith(
      event.channel,
      event.event_origin,
      context,
    );
  });

  it('returns a resolved promise when an alert is added', async () => {
    const event = {
      event_origin: {
        version: '0',
        id: '0495e5eb-9b99-56f2-7849-96389238fb55',
        'detail-type': 'MediaLive Channel Alert',
        source: 'aws.medialive',
        account: 'account_id',
        time: '2020-06-15T15:18:29Z',
        region: 'eu-west-1',
        resources: ['arn:aws:medialive:eu-west-1:account_id:channel:1234567'],
        detail: {
          alarm_state: 'CLEARED',
          alarm_id: 'f4d3c12657a5229762740ef2f2113afa1cd04cb1',
          alert_type: 'Video Not Detected',
          pipeline: '0',
          channel_arn: 'arn:aws:medialive:eu-west-1:account_id:channel:1234567',
          message: '[VideoBuffer[1]] Video not detected: Check input signal',
        },
      },
      channel: {
        Name: 'video-id_stamp',
      },
    };

    const context = {
      awsRequestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      logGroupName: '/aws/lambda/dev-test-marsha-medialive',
    };

    await lambda(event, context);
  });

  it('reports an error when the event type is not handled', async () => {
    const event = {
      event_origin: {
        version: '0',
        id: '0495e5eb-9b99-56f2-7849-96389238fb55',
        'detail-type': 'unknow type',
        source: 'aws.medialive',
        account: 'account_id',
        time: '2020-06-15T15:18:29Z',
        region: 'eu-west-1',
        resources: ['arn:aws:medialive:eu-west-1:account_id:channel:1234567'],
        detail: {
          channel_arn: 'arn:aws:medialive:eu-west-1:account_id:channel:1234567',
          state: 'RUNNING',
          message: 'Created channel',
          pipeline: '0',
          pipelines_running_count: 0,
        },
      },
      channel: {
        Name: 'video-id_stamp',
      },
    };

    const context = {
      awsRequestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      logGroupName: '/aws/lambda/dev-test-marsha-medialive',
    };

    await expect(lambda(event, context)).rejects.toEqual(
      'Unknown medialive event',
    );

    expect(mockChannelStateChanged).not.toHaveBeenCalled();
  });

  it('reports an error when channelStateChanged fails', async () => {
    const event = {
      event_origin: {
        version: '0',
        id: '0495e5eb-9b99-56f2-7849-96389238fb55',
        'detail-type': 'MediaLive Channel State Change',
        source: 'aws.medialive',
        account: 'account_id',
        time: '2020-06-15T15:18:29Z',
        region: 'eu-west-1',
        resources: ['arn:aws:medialive:eu-west-1:account_id:channel:1234567'],
        detail: {
          channel_arn: 'arn:aws:medialive:eu-west-1:account_id:channel:1234567',
          state: 'RUNNING',
          message: 'Created channel',
          pipeline: '0',
          pipelines_running_count: 0,
        },
      },
      channel: {
        Name: 'video-id_stamp',
      },
    };

    const context = {
      awsRequestId: '7954d4d1-9dd3-47f4-9542-e7fd5f937fe6',
      logGroupName: '/aws/lambda/dev-test-marsha-medialive',
    };

    mockChannelStateChanged.mockRejectedValue('it fails');

    await expect(lambda(event, context)).rejects.toEqual('it fails');

    expect(mockChannelStateChanged).toHaveBeenCalledWith(
      event.channel,
      event.event_origin,
      context,
    );
  });
});
