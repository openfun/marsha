import { AppData, appState, ResourceType } from '../../types/AppData';

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

export function parseDataElements<R extends ResourceType>(
  elements: Element[],
  resource: R,
): AppData<R> {
  const data: any = elements.reduce(
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
            return {
              ...acc,
              [element.id]: JSON.parse(
                element.getAttribute(`data-${element.id}`)!,
              ),
            };
          } else {
            // If there's no ID, just merge on the main accumulator
            return {
              ...acc,
              [key.substr(5)]: element.getAttribute(key),
            };
          }
        }, rootAcc),
    {},
  );

  const appData: AppData<R> = {
    document: data.document,
    jwt: data.jwt,
    resourceType: resource,
    state: data.state as appState,
    video: data.video,
  };

  return appData;
}
