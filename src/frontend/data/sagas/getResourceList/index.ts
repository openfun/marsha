import { stringify } from 'querystring';
import { call, put, takeEvery } from 'redux-saga/effects';

import { API_ENDPOINT, API_LIST_DEFAULT_PARAMS } from '../../../settings';
import { requestStatus, Resp } from '../../../types/api';
import { modelName } from '../../../types/models';
import { addMultipleResources } from '../../genericReducers/resourceById/actions';
import {
  didGetResourceList,
  failedToGetResourceList,
  ResourceListGet,
} from '../../genericReducers/resourceList/actions';

/**
 * Makes and handles the actual GET request for a resource list.
 * @param jwt The token to use to authenticate the request.
 * @param resourceName The model name for the resource for which we're getting a list.
 * @param params The parameters for the list request.
 */
export async function fetchList(
  jwt: string,
  resourceName: modelName,
  params: ResourceListGet['params'] = API_LIST_DEFAULT_PARAMS,
): Promise<Resp> {
  const endpoint = `${API_ENDPOINT}/${resourceName}/`;

  try {
    const response = await fetch(`${endpoint}?${stringify(params)}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(
        `Failed to get list for ${endpoint} and ${JSON.stringify(params)} : ${
          response.status
        }.`,
      );
    }

    return { objects: await response.json(), status: requestStatus.SUCCESS };
  } catch (error) {
    return { error, status: requestStatus.FAILURE };
  }
}

/**
 * Manages the workflow for a GET on a resource list.
 * @param action The `RESOURCE_LIST_GET` action that triggered the saga.
 */
export function* getList(action: ResourceListGet) {
  const { jwt, params, resourceName } = action;
  const response: Resp = yield call(fetchList, jwt, resourceName, params);

  if (response.status === requestStatus.FAILURE) {
    yield put(failedToGetResourceList(resourceName, response.error));
  } else {
    // Add each individual resource to the state before we put the success action in
    // order to avoid race conditions / incomplete data sets
    yield put(addMultipleResources(resourceName, response.objects));
    yield put(didGetResourceList(resourceName, response.objects, params!));
  }
}

/**
 * Saga. GETs the relevant resource list from the API whenever it receives a `RESOURCE_LIST_GET` action.
 */
export function* getResourceListSaga() {
  // We can cancel ongoing requests whenever there's a new one: the user will not request several different sets
  // of filters of the same kind at the same time.
  yield takeEvery('RESOURCE_LIST_GET', getList);
}
