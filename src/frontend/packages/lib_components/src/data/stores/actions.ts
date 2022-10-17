/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { uploadableModelName } from '../../types/models';
import { StoreState } from '../../types/stores';
import { Resource } from '../../types/tracks';

export function addResource<R extends Resource>(
  state: StoreState<R>,
  objectType: uploadableModelName,
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
  objectType: uploadableModelName,
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
  objectType: uploadableModelName,
  object: R,
) {
  const objects = Object.values(state[objectType]!).filter(
    (objectToFilter: R) => objectToFilter.id !== object.id,
  );

  return {
    [objectType]: {
      ...objects.reduce(
        (acc, resource) => ({ ...acc, [resource.id]: resource }),
        {},
      ),
    },
  };
}
