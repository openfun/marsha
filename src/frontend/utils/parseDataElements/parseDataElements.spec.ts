import { ModelName } from '../../types/models';
import { parseDataElements } from './parseDataElements';

describe.only('utils/parseDataElements', () => {
  describe('parseDataElements()', () => {
    it('parses the data-context and creates a video attribute', () => {
      const dataElement = document.createElement('div');
      const context = {
        modelName: ModelName.VIDEOS,
        resource: { id: 'video1' },
      };
      dataElement.setAttribute('data-context', JSON.stringify(context));

      const data = parseDataElements(dataElement);
      expect(data.video).toEqual(context.resource);
    });

    it('parses the data-context and creates a document attribute', () => {
      const dataElement = document.createElement('div');
      const context = {
        modelName: ModelName.DOCUMENTS,
        resource: { id: 'doc' },
      };
      dataElement.setAttribute('data-context', JSON.stringify(context));

      const data = parseDataElements(dataElement);
      expect(data.document).toEqual(context.resource);
    });

    it('throws an error when the model name is not supported', () => {
      const dataElement = document.createElement('div');
      const context = {
        modelName: ModelName.THUMBNAILS,
        resource: { id: 'thumbnail' },
      };
      dataElement.setAttribute('data-context', JSON.stringify(context));

      expect(() => {
        parseDataElements(dataElement);
      }).toThrowError(`Model ${ModelName.THUMBNAILS} not supported`);
    });
  });
});
