import { AppData } from '../../types/AppData';
import { modelName } from '../../types/models';

// Transform a data-attribute into a proper key: drop 'data-' & camel-case it
// Exported for testing purposes
export const keyFromAttr = (attribute: string) => {
  return (
    attribute
      // Drop 'data-'
      .substr(5)
      .split('-')
      .map((part, index) =>
        // Capitalize all but the first part to get a camelCased name
        index === 0 ? part : part[0].toUpperCase() + part.substr(1),
      )
      .join('')
  );
};

// Extract all the necessary data the backend passed us through data-attributes on some elements
export const parseDataElements: (
  dataElements: Element[],
) => AppData = dataElements => {
  // Iterate over the data elements to add their data onto the root accumulator (starting with {})
  return dataElements.reduce(
    (rootAcc, element) =>
      Object.keys(element.attributes)
        // Get the actual attribute names from the NamedNodeMap object
        .map(index => {
          return element.attributes[Number(index)].nodeName;
        })
        // Filter out non-data attributes
        .filter(key => key.indexOf('data-') === 0)
        // Build the policy object using the element as data-{key}="value"
        .reduce((acc: any, key) => {
          if (element.id) {
            // Use of ID denotes a nested object
            // Nested objects use straight JSON instead of a series of data-attributes
            const obj = {
              ...acc,
              modelName: element.id,
            };

            switch (obj.modelName) {
              case modelName.VIDEOS:
                obj.video = JSON.parse(element.getAttribute(`data-resource`)!);
                break;
              case modelName.DOCUMENTS:
                obj.document = JSON.parse(
                  element.getAttribute(`data-resource`)!,
                );
                break;
              default:
                throw new Error(`model ${obj.modelName} not supported`);
            }

            return obj;
          } else {
            // If there's no ID, just merge on the main accumulator
            return {
              ...acc,
              [key.substr(5)]: element.getAttribute(key),
            };
          }
        }, rootAcc),
    {},
  ) as AppData;
};
