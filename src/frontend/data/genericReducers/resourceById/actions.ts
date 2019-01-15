import { modelName } from '../../../types/models';
import { Resource } from '../../../types/Resource';

export interface ResourceAdd<R extends Resource> {
  type: 'RESOURCE_ADD';
  resourceName: modelName;
  resource: R;
}

export function addResource<R extends Resource>(
  resourceName: modelName,
  resource: R,
): ResourceAdd<R> {
  return {
    resource,
    resourceName,
    type: 'RESOURCE_ADD',
  };
}

export interface ResourceDelete<R extends Resource> {
  type: 'RESOURCE_DELETE';
  resourceName: modelName;
  resource: R;
}

export function deleteResource<R extends Resource>(
  resourceName: modelName,
  resource: R,
): ResourceDelete<R> {
  return {
    resource,
    resourceName,
    type: 'RESOURCE_DELETE',
  };
}

export interface ResourceMultipleAdd<R extends Resource> {
  type: 'RESOURCE_MULTIPLE_ADD';
  resourceName: modelName;
  resources: R[];
}

export function addMultipleResources<R extends Resource>(
  resourceName: modelName,
  resources: R[],
): ResourceMultipleAdd<R> {
  return {
    resourceName,
    resources,
    type: 'RESOURCE_MULTIPLE_ADD',
  };
}
