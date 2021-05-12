import { render } from '@testing-library/react';
import React from 'react';

import { LiveModeType, liveState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import DashboardVideoLiveJitsi from '.';

const mockExecuteCommand = jest.fn();
const mockJitsi = jest.fn().mockImplementation(() => ({
  executeCommand: mockExecuteCommand,
}));

describe('<DashboardVideoLiveJitsi />', () => {
  it('configures jitsi', () => {
    const video = videoMockFactory({
      live_info: {
        medialive: {
          input: {
            endpoints: [
              'rtmp://1.2.3.4:1935/stream-key-primary',
              'rtmp://4.3.2.1:1935/stream-key-secondary',
            ],
          },
        },
        type: LiveModeType.JITSI,
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.CREATING,
    });
    global.JitsiMeetExternalAPI = mockJitsi;

    const { rerender } = render(<DashboardVideoLiveJitsi video={video} />);
    const toolbarButtons = [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'embedmeeting',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'chat',
      'etherpad',
      'shareaudio',
      'settings',
      'raisehand',
      'videoquality',
      'filmstrip',
      'invite',
      'feedback',
      'stats',
      'shortcuts',
      'tileview',
      'select-background',
      'help',
      'mute-everyone',
      'mute-video-everyone',
      'security',
    ];
    expect(mockJitsi).toHaveBeenCalledWith('meet.jit.si', {
      configOverwrite: {
        constraints: {
          video: {
            height: {
              ideal: 720,
              max: 720,
              min: 240,
            },
          },
        },
        resolution: 720,
        toolbarButtons,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: toolbarButtons,
      },
      parentNode: expect.any(HTMLElement),
      roomName: video.id,
    });

    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'startRecording',
      expect.any({}),
    );
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );

    // state switch to running, recording must start
    rerender(
      <DashboardVideoLiveJitsi
        video={{ ...video, live_state: liveState.RUNNING }}
      />,
    );

    expect(mockExecuteCommand).toHaveBeenCalledWith('startRecording', {
      mode: 'stream',
      rtmpStreamKey: 'rtmp://1.2.3.4:1935/marsha/stream-key-primary',
    });
    expect(mockExecuteCommand).not.toHaveBeenCalledWith(
      'stopRecording',
      expect.any(String),
    );

    // state switch to stopping, recording must stop
    rerender(
      <DashboardVideoLiveJitsi
        video={{ ...video, live_state: liveState.STOPPING }}
      />,
    );

    expect(mockExecuteCommand).toHaveBeenCalledWith('stopRecording', 'stream');

    expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
  });
});
