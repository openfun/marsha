import {
  addMultipleResources,
  API_ENDPOINT,
  API_LIST_DEFAULT_PARAMS,
  APIListCommonRequestParams,
  fetchWrapper,
  modelName,
  requestStatus,
  report,
  useJwt,
} from 'lib-components';

/**
 * Makes and handles the GET request for a resource list. First returns a curried function that
 * enables us to easily pass the first batch of params from the connector.
 * @param dispatch The dispatcher for the store we're using for this given call.
 * @param resourceName The model name for the resource for which we're getting a list.
 * @param params The parameters for the list request.
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export const getResourceList = async (
  resourceName: modelName,
  params: APIListCommonRequestParams = API_LIST_DEFAULT_PARAMS,
): Promise<requestStatus> => {
  const endpoint = `${API_ENDPOINT}/${resourceName}/`;

  try {
    const response = await fetchWrapper(
      `${endpoint}?limit=${params.limit}&offset=${params.offset}`,
      {
        headers: {
          Authorization: `Bearer ${useJwt.getState().jwt}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(
        `Failed to get list for ${endpoint} and ${JSON.stringify(params)} : ${
          response.status
        }.`,
      );
    }

    const resourcesResponse = await response.json();
    await addMultipleResources(resourceName, resourcesResponse.results);
    return requestStatus.SUCCESS;
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
};
