import { ResourceType } from '../types/AppData';
import { parseDataElements } from '../utils/parseDataElements/parseDataElements';

// Spread to pass an array instead of a NodeList

const elements = [...document.querySelectorAll('.marsha-frontend-data')];
const element = document.querySelector('.marsha-frontend-data[id]');

export const appData = {
  ...parseDataElements(elements, element!.id as ResourceType),
};
