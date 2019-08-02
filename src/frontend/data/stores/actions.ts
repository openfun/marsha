import { modelName } from '../../types/models';
import { StoreState } from '../../types/stores';
import { Resource } from '../../types/tracks';

export function addResource<R extends Resource>(
  state: StoreState<R>,
  objectType: modelName,
  object: R,
) {
  return {
    [objectType]: {
      ...state[objectType],
      [object.id]: object,
    },
  };
}

export function addMultipleResources<R extends Resource>(
  state: StoreState<R>,
  objectType: modelName,
  objects: R[],
) {
  return {
    [objectType]: {
      ...state[objectType],
      ...objects.reduce((acc, object) => ({ ...acc, [object.id]: object }), {}),
    },
  };
}

export function removeResource<R extends Resource>(
  state: StoreState<R>,
  objectType: modelName,
  object: R,
) {
  return {
    [objectType]: {
      ...state[objectType],
      [object.id]: undefined,
    },
  };
}
