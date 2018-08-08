// Make a policy object from an element that encodes it using data-attributes
export const parsePolicyElement = (policyElement: Element) => {
  return (
    Object.keys(policyElement.attributes)
      // Get the actual attribute names from the NamedNodeMap object
      .map((index: any) => {
        return policyElement.attributes[index].nodeName;
      })
      // Build the policy object using the element as data-{key}="value"
      .reduce(
        (acc, key) => ({
          ...acc,
          [key.substr(5)]: policyElement.getAttribute(key),
        }),
        {},
      )
  );
};
