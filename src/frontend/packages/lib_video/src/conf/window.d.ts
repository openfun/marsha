/* eslint-disable no-var */
import { converse } from 'lib-components';
import JitsiMeetExternalAPI from 'lib-components/lib/types/libs/JitsiMeetExternalAPI/index';

// Ensure this is treated as a module.
export {};

declare global {
  var converse: converse.Converse;
  var JitsiMeetExternalAPI: JitsiMeetExternalAPI;
}
