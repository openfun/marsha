import { APIListCommonRequestParams } from '../../../types/api';
import { modelName } from '../../../types/models';
import { Resource } from '../../../types/tracks';
import { Maybe } from '../../../utils/types';

export interface ResourceListGet {
  params: Partial<APIListCommonRequestParams> & {
    [key: string]: Maybe<string | number | Array<string | number>>;
  };
  resourceName: modelName;
  type: 'RESOURCE_LIST_GET';
}

export const getResourceList = (
  resourceName: modelName,
  params: ResourceListGet['params'] = {},
): ResourceListGet => ({
  params,
  resourceName,
  type: 'RESOURCE_LIST_GET',
});

export interface ResourceListGetFailure {
  error: Error | string;
  resourceName: modelName;
  type: 'RESOURCE_LIST_GET_FAILURE';
}

export const failedToGetResourceList = (
  resourceName: modelName,
  error: ResourceListGetFailure['error'],
): ResourceListGetFailure => ({
  error,
  resourceName,
  type: 'RESOURCE_LIST_GET_FAILURE',
});

export interface ResourceListGetSuccess<R extends Resource> {
  apiResponse: { objects: R[] };
  params: Partial<APIListCommonRequestParams> & {
    [key: string]: Maybe<string | number | Array<string | number>>;
  };
  resourceName: modelName;
  type: 'RESOURCE_LIST_GET_SUCCESS';
}

export const didGetResourceList = <R extends Resource>(
  resourceName: modelName,
  objects: R[],
  params: ResourceListGetSuccess<R>['params'],
): ResourceListGetSuccess<R> => ({
  apiResponse: { objects },
  params,
  resourceName,
  type: 'RESOURCE_LIST_GET_SUCCESS',
});
