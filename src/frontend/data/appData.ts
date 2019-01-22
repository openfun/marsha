import { parseDataElements } from '../utils/parseDataElements/parseDataElements';

export const appData = {
  ...parseDataElements(
    // Spread to pass an array instead of a NodeList
    [...document.querySelectorAll('.marsha-frontend-data')],
  ),
};
