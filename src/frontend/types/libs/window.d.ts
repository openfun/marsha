import { Participant } from '../Participant';

// Ensure this is treated as a module.
export {};

declare global {
  interface Window {
    converse: {
      joinRoomWithNickname: () => void;
      acceptParticipantToMount: (participant: Participant) => void;
      askParticipantToMount: () => void;
      kickParticipant: (participant: Participant) => void;
      rejectParticipantToMount: (participant: Participant) => void;
      participantLeaves: () => void;
      insertInto: (container: HTMLElement) => void;
      initialize: (options: any) => void;
      env: any;
      plugins: {
        add: (name: string, plugin: any) => void;
      };
    };
    JitsiMeetExternalAPI: JitsiMeetExternalAPI;
  }
}
