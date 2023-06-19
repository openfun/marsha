import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Deferred, render } from 'lib-tests';

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
jest.mock('hooks/useJitsiApi', () => ({
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

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Unmute' }),
    ).not.toBeInTheDocument();
  });

  it('renders microphone on svg when audio is on', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(false));

    await screen.findByRole('button', { name: 'Mute' });
  });

  it('renders microphone off svg when audio is off', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(true));

    await screen.findByRole('button', { name: 'Unmute' });
  });

  it('listens to jitsi audio changes', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Unmute' }),
    ).not.toBeInTheDocument();

    act(() => dispatch('audioMuteStatusChanged', { muted: true }));

    await screen.findByRole('button', { name: 'Unmute' });
    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();

    act(() => dispatch('audioMuteStatusChanged', { muted: false }));

    await screen.findByRole('button', { name: 'Mute' });
    expect(
      screen.queryByRole('button', { name: 'Unmute' }),
    ).not.toBeInTheDocument();
  });

  it('calls jitsi command on button click', async () => {
    const deferred = new Deferred();
    mockIsAudioMuted.mockReturnValue(deferred.promise);

    render(<AudioControl />);

    await waitFor(() => expect(events.audioMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(true));

    await screen.findByRole('button', { name: 'Unmute' });

    expect(mockExecuteCommand).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button'));

    expect(mockExecuteCommand).toHaveBeenCalled();
    expect(mockExecuteCommand).toHaveBeenCalledWith('toggleAudio');
  });
});
