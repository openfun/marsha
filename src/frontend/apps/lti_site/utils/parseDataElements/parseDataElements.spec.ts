import { modelName } from 'lib-components';

import { parseDataElements } from './parseDataElements';

describe.only('utils/parseDataElements', () => {
  describe('parseDataElements()', () => {
    it('parses the data-context and creates a video attribute', () => {
      const dataElement = document.createElement('div');
      const context = {
        modelName: modelName.VIDEOS,
        resource: { id: 'video1' },
      };
      dataElement.setAttribute('data-context', JSON.stringify(context));

      const data = parseDataElements(dataElement);
      expect(data.video).toEqual(context.resource);
      expect(data.resource_id).toEqual(data.video!.id);
      expect(data.resource).toEqual(undefined);
    });

    it('parses the data-context and creates a document attribute', () => {
      const dataElement = document.createElement('div');
      const context = {
        modelName: modelName.DOCUMENTS,
        resource: { id: 'doc' },
      };
      dataElement.setAttribute('data-context', JSON.stringify(context));

      const data = parseDataElements(dataElement);
      expect(data.document).toEqual(context.resource);
      expect(data.resource_id).toEqual(data.document!.id);
      expect(data.resource).toEqual(undefined);
    });

    it('adds the resource_id parameter when the model is unknown', () => {
      const dataElement = document.createElement('div');
      const context = {
        modelName: modelName.THUMBNAILS,
        resource: { id: 'thumbnail' },
      };
      dataElement.setAttribute('data-context', JSON.stringify(context));

      const data = parseDataElements(dataElement);
      expect(data).toEqual({
        resource_id: 'thumbnail',
        ...context,
      });
    });
  });
});
