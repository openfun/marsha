import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Deferred, render } from 'lib-tests';

import { CameraControl } from '.';

let events: any = {};
const dispatch = (eventName: string, eventObject: any) => {
  events[eventName](eventObject);
};

const mockExecuteCommand = jest.fn();
const mockIsVideoMuted = jest.fn();
const mockAddListener = jest
  .fn()
  .mockImplementation((eventName: string, callback: (event: any) => void) => {
    events[eventName] = callback;
  });
const mockJitsi = {
  executeCommand: mockExecuteCommand,
  isVideoMuted: mockIsVideoMuted,
  addListener: mockAddListener,
  removeListener: (eventName: string) => {
    delete events[eventName];
  },
};
jest.mock('hooks/useJitsiApi', () => ({
  useJitsiApi: jest.fn().mockImplementation(() => [mockJitsi]),
}));

describe('<CameraControl />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    events = {};
  });

  it('renders nothing until video is initialized', async () => {
    const deferred = new Deferred();
    mockIsVideoMuted.mockReturnValue(deferred.promise);

    render(<CameraControl />);

    await waitFor(() => expect(events.videoMuteStatusChanged).toBeDefined());

    expect(
      screen.queryByRole('button', { name: 'Hide cam' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show cam' }),
    ).not.toBeInTheDocument();
  });

  it('renders camera on svg when video is on', async () => {
    const deferred = new Deferred();
    mockIsVideoMuted.mockReturnValue(deferred.promise);

    render(<CameraControl />);

    await waitFor(() => expect(events.videoMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(false));

    await screen.findByRole('button', { name: 'Hide cam' });
  });

  it('renders camera off svg when video is off', async () => {
    const deferred = new Deferred();
    mockIsVideoMuted.mockReturnValue(deferred.promise);

    render(<CameraControl />);

    await waitFor(() => expect(events.videoMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(true));

    await screen.findByRole('button', { name: 'Show cam' });
  });

  it('listens to jitsi video changes', async () => {
    const deferred = new Deferred();
    mockIsVideoMuted.mockReturnValue(deferred.promise);

    render(<CameraControl />);

    await waitFor(() => expect(events.videoMuteStatusChanged).toBeDefined());

    expect(
      screen.queryByRole('button', { name: 'Hide cam' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show cam' }),
    ).not.toBeInTheDocument();

    act(() => dispatch('videoMuteStatusChanged', { muted: true }));

    await screen.findByRole('button', { name: 'Show cam' });
    expect(
      screen.queryByRole('button', { name: 'Hide cam' }),
    ).not.toBeInTheDocument();

    act(() => dispatch('videoMuteStatusChanged', { muted: false }));

    await screen.findByRole('button', { name: 'Hide cam' });
    expect(
      screen.queryByRole('button', { name: 'Show cam' }),
    ).not.toBeInTheDocument();
  });

  it('calls jitsi command on button click', async () => {
    const deferred = new Deferred();
    mockIsVideoMuted.mockReturnValue(deferred.promise);

    render(<CameraControl />);

    await waitFor(() => expect(events.videoMuteStatusChanged).toBeDefined());

    act(() => deferred.resolve(true));

    await screen.findByRole('button', { name: 'Show cam' });

    expect(mockExecuteCommand).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button'));

    expect(mockExecuteCommand).toHaveBeenCalled();
    expect(mockExecuteCommand).toHaveBeenCalledWith('toggleVideo');
  });
});
