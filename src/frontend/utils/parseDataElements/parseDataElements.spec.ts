import { Document } from '../../types/file';
import { uploadState } from '../../types/tracks';
import { keyFromAttr, parseDataElements } from './parseDataElements';

describe.only('utils/parseDataElements', () => {
  describe('keyFromAttr()', () => {
    it('drops "data-" from the attribute name and camel-cases it', () => {
      expect(keyFromAttr('data-example')).toEqual('example');
      expect(keyFromAttr('data-split-name')).toEqual('splitName');
    });
  });

  describe('parseDataElements()', () => {
    it('returns an object from the key/values of a data-element', () => {
      // Build some bogus object with string values & lowecase string keys
      const data: { [key: string]: string } = {
        keyone: 'valueOne',
        keytwo: 'valueTwo',
      };
      // Set up the element that contains our data as data-attributes
      const dataElement = document.createElement('div');
      Object.keys(data).forEach(key =>
        dataElement.setAttribute(`data-${key}`, data[key]),
      );
      // The data is extracted from the data element
      expect(parseDataElements([dataElement])).toEqual(data);
    });

    it('merges data from two separate elements', () => {
      // Build some bogus objects with string values & lowecase string keys
      const dataX: { [key: string]: string } = {
        keythree: 'valueThree',
      };
      const dataY: { [key: string]: string } = {
        keyfour: 'valueFour',
      };
      // Set up the elements that contains our data as data-attributes
      const dataElementX = document.createElement('div');
      Object.keys(dataX).forEach(key =>
        dataElementX.setAttribute(`data-${key}`, dataX[key]),
      );
      const dataElementY = document.createElement('div');
      Object.keys(dataY).forEach(key =>
        dataElementY.setAttribute(`data-${key}`, dataY[key]),
      ); // The data is extracted from the data element
      expect(parseDataElements([dataElementX, dataElementY])).toEqual({
        ...dataX,
        ...dataY,
      });
    });

    it('creates a nested object when an element as an ID attribute', () => {
      // Build some bogus objects with string values & lowecase string keys
      const data: { [data: string]: string } = {
        keyfive: 'valueFive',
      };
      // create a document
      const doc: Document = {
        description: '',
        id: '46',
        is_ready_to_display: true,
        show_download: true,
        title: 'foo.pdf',
        upload_state: uploadState.READY,
        url: 'https://example.com/document/45',
      };
      // Set up the element that contains our bogus data as data-attributes
      const dataElement = document.createElement('div');
      Object.keys(data).forEach(key =>
        dataElement.setAttribute(`data-${key}`, data[key]),
      );
      // Set up the element that contains the policy as data-attributes
      const documentElement = document.createElement('div');
      documentElement.id = 'document'; // triggers the creation of a nested object
      documentElement.setAttribute('data-document', JSON.stringify(doc));
      documentElement.setAttribute('data-modelname', 'documents');
      // The bogus data and policy are extracted from the data elements
      expect(parseDataElements([dataElement, documentElement])).toEqual({
        ...data,
        document: doc,
        modelName: 'documents',
      });
    });
  });
});
