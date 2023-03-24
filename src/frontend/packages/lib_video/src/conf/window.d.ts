/* eslint-disable no-var */
import JitsiMeetExternalAPI from 'lib-components/lib/types/libs/JitsiMeetExternalAPI/index';
import converse from 'lib-components/lib/types/libs/converse/index';

// Ensure this is treated as a module.
export {};

declare global {
  var converse: converse.Converse;
  var JitsiMeetExternalAPI: JitsiMeetExternalAPI;
}
