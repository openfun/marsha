import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Deferred } from 'utils/tests/Deferred';

import { AudioControl } from '.';

let events: any = {};
const dispatch = (eventName: string, eventObject: any) => {
  events[eventName](eventObject);
};

const mockExecuteCommand = jest.fn();
const mockIsAudioMuted = jest.fn();
const mockAddListener = jest
  .fn()
  .mockImplementation((eventName: string, callback: (event: any) => void) => {
    events[eventName] = callback;
  });
const mockJitsi = {
  executeCommand: mockExecuteCommand,
  isAudioMuted: mockIsAudioMuted,
  addListener: mockAddListener,
  removeListener: (eventName: string) => {
    delete events[eventName];
  },
};
jest.mock('data/stores/useJitsiApi', () => ({
  useJitsiApi: jest.fn().mockImplementation(() => [mockJitsi]),
}));

describe('<AudioControl />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    events = {};
  });

  it('renders nothing until audio is initialized', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    const { container } = render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    expect(container.children.length).toEqual(0);
  });

  it('renders microphone on svg when audio is on', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(false));

    await screen.findByTestId('jitsi-micro-on');
  });

  it('renders microphone off svg when audio is off', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(true));

    await screen.findByTestId('jitsi-micro-off');
  });

  it('listens to jitsi audio changes', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    expect(screen.queryByTestId('jitsi-micro-on')).not.toBeInTheDocument();
    expect(screen.queryByTestId('jitsi-micro-off')).not.toBeInTheDocument();

    act(() => dispatch('audioMuteStatusChanged', { muted: true }));

    expect(screen.queryByTestId('jitsi-micro-on')).not.toBeInTheDocument();
    await screen.findByTestId('jitsi-micro-off');

    act(() => dispatch('audioMuteStatusChanged', { muted: false }));

    await screen.findByTestId('jitsi-micro-on');
    expect(screen.queryByTestId('jitsi-micro-off')).not.toBeInTheDocument();
  });

  it('calls jitsi command on button click', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(true));

    await screen.findByTestId('jitsi-micro-off');

    expect(mockExecuteCommand).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button'));

    expect(mockExecuteCommand).toHaveBeenCalled();
    expect(mockExecuteCommand).toHaveBeenCalledWith('toggleAudio');
  });
});
