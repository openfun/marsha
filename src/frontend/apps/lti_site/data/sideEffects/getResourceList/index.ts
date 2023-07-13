import {
  APIList,
  APIListCommonRequestParams,
  API_ENDPOINT,
  API_LIST_DEFAULT_PARAMS,
  UploadableObject,
  addMultipleResources,
  fetchResponseHandler,
  fetchWrapper,
  modelName,
  report,
  requestStatus,
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

  const jwt = useJwt.getState().getJwt();
  if (!jwt) {
    throw new Error('JWT not available');
  }

  try {
    const response = await fetchWrapper(
      `${endpoint}?limit=${params.limit}&offset=${params.offset}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const resourcesResponse = await fetchResponseHandler<
      APIList<UploadableObject>
    >(response, {
      // Push remote errors to the error channel for consistency
      errorMessage: `Failed to get list for ${endpoint} and ${JSON.stringify(
        params,
      )} : ${response.status}.`,
    });

    await addMultipleResources(resourceName, resourcesResponse.results);
    return requestStatus.SUCCESS;
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
};
