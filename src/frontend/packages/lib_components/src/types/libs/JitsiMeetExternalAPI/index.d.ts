/* eslint-disable @typescript-eslint/no-explicit-any */
import { Nullable } from 'utils/types';

export as namespace JitsiMeetExternalAPI;
export = JitsiMeetExternalAPI;

declare class JitsiMeetExternalAPI {
  constructor(
    domain: string,
    options?: {
      configOverwrite?: JitsiMeetExternalAPI.ConfigOverwriteOptions;
      interfaceConfigOverwrite?: JitsiMeetExternalAPI.InterfaceConfigOverwrtieOptions;
      jwt?: string;
      parentNode?: HTMLElement;
      roomName?: string;
      userInfo?: {
        email?: Nullable<string>;
        displayName?: Nullable<string>;
      };
    },
  );

  getLivestreamUrl: () => Promise<any>;
  executeCommand: (
    command: JitsiMeetExternalAPI.Command,
    options?:
      | JitsiMeetExternalAPI.RecordingMode
      | JitsiMeetExternalAPI.RecordingOptions
      | JitsiMeetExternalAPI.ConfigOption,
  ) => void;
  addListener: (eventName: string, callback: (event: any) => void) => void;
  removeListener: (eventName: string, callback: (event: any) => void) => void;
  isAudioMuted: () => Promise<boolean>;
  isVideoMuted: () => Promise<boolean>;
  dispose: () => void;
}

// tslint:disable-next-line:no-namespace
declare namespace JitsiMeetExternalAPI {
  export type Command =
    | 'startRecording'
    | 'stopRecording'
    | 'toggleAudio'
    | 'toggleVideo'
    | 'overwriteConfig';
  export type RecordingMode = 'stream' | 'file';
  export type RecordingOptions = {
    mode: RecordingMode;
    rtmpStreamKey: string;
  };
  type ConfigOption = {
    toolbarButtons?: string[];
  };
  export type ConfigOverwriteOptions = {
    constraints?: {
      video: {
        height: {
          ideal: number;
          max: number;
          min: number;
        };
      };
    };
    conferenceInfo?: {
      alwaysVisible: string[];
      autoHide: string[];
    };
    disableDeepLinking?: boolean;
    disablePolls?: boolean;
    hideConferenceSubject?: boolean;
    hideConferenceTimer?: boolean;
    doNotStoreRoom?: boolean;
    prejoinConfig?: {
      enabled?: boolean;
      hideDisplayName?: boolean;
      hideExtraJoinButtons?: string[];
    };
    resolution?: number;
    toolbarButtons?: string[];
  };
  export type InterfaceConfigOverwrtieOptions = {
    HIDE_INVITE_MORE_HEADER?: boolean;
    TOOLBAR_BUTTONS?: string[];
  };
}
