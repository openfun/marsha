import { appState, ResourceType } from '../../types/AppData';
import { keyFromAttr, parseDataElements } from './parseDataElements';

describe.only('utils/parseDataElements', () => {
  describe('keyFromAttr()', () => {
    it('drops "data-" from the attribute name and camel-cases it', () => {
      expect(keyFromAttr('data-example')).toEqual('example');
      expect(keyFromAttr('data-split-name')).toEqual('splitName');
    });
  });

  describe('parseDataElements()', () => {
    it('return a AppData object', () => {
      const element = document.createElement('div');
      element.setAttribute('data-jwt', 'jwt');
      element.setAttribute('data-state', appState.INSTRUCTOR);
      const otherElement = document.createElement('div');
      otherElement.setAttribute('id', 'video');
      otherElement.setAttribute('data-video', JSON.stringify({ id: 42 }));

      expect(
        parseDataElements([element, otherElement], ResourceType.VIDEO),
      ).toEqual({
        document: undefined,
        jwt: 'jwt',
        resourceType: ResourceType.VIDEO,
        state: appState.INSTRUCTOR,
        video: { id: 42 },
      });
    });
  });
});
