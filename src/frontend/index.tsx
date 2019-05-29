import 'iframe-resizer/js/iframeResizer.contentWindow';

import jwtDecode from 'jwt-decode';
import { addLocaleData } from 'react-intl';

import { appData } from './data/appData';
import { AppData, ResourceType } from './types/AppData';
import { DecodedJwt } from './types/jwt';

const decodedToken: DecodedJwt = jwtDecode(appData.jwt);

let localeCode = decodedToken.locale;
if (localeCode.match(/^.*_.*$/)) {
  localeCode = localeCode.split('_')[0];
}

// Wait for the DOM to load before we scour it for an element that requires React to render
document.addEventListener('DOMContentLoaded', async event => {
  try {
    const localeData = await import(`react-intl/locale-data/${localeCode}`);
    addLocaleData(Object.values(localeData));
  } catch (e) {}

  let translatedMessages = null;
  try {
    translatedMessages = await import(
      `./translations/${decodedToken.locale}.json`
    );
  } catch (e) {}

  switch (appData.resourceType) {
    case ResourceType.VIDEO:
      const app = await import('./appVideo');
      app.appVideo(
        appData as AppData<ResourceType.VIDEO>,
        localeCode,
        translatedMessages,
      );
      break;
  }
});
