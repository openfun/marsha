import { Participant } from '../Participant';
import { Video } from '../tracks';

// Ensure this is treated as a module.
export {};

declare global {
  interface Window {
    converse: {
      acceptParticipantToJoin: (participant: Participant, video: Video) => void;
      askParticipantToJoin: () => void;
      kickParticipant: (participant: Participant) => void;
      rejectParticipantToJoin: (participant: Participant) => void;
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
