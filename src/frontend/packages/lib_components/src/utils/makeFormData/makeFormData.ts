// This formData wrapper has 2 purposes:
//   - provide a level of indirection that lets us write unit tests
//   - use a cleaner API than calling formData.append N times manually
export const makeFormData = (
  // NB: order of keys is important here, which is why we do not iterate over an object
  ...keyValuePairs: [string, string | File][]
) => {
  const formData = new FormData();
  keyValuePairs.forEach(([key, value]) => formData.append(key, value));
  return formData;
};
