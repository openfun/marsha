import React from 'react';

import { getResource as fetchResource } from '../../data/sideEffects/getResource';
import { updateResource } from '../../data/sideEffects/updateResource';
import { addResource, getResource } from '../../data/stores/generics';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { UploadManagerState, UploadManagerStatus, useUploadManager } from '.';

const UploadSuccessHandler = ({
  objectState,
}: {
  objectState: UploadManagerState[string];
}) => {
  useAsyncEffect(async () => {
    if (objectState.status === UploadManagerStatus.SUCCESS) {
      const { file, objectId, objectType } = objectState;
      const object = await getResource(objectType, objectId);
      if (object!.hasOwnProperty('title')) {
        // Add the new object with title and upload_state in the store
        // to replace the old state.
        await addResource(objectType, {
          ...object!,
          title: file.name,
        });

        // Fetch the API to update the title resource.
        await updateResource(
          {
            ...object!,
            title: file.name,
          },
          objectType,
        );
      }
    }

    if (objectState.status === UploadManagerStatus.UPLOADING) {
      const { objectId, objectType } = objectState;
      await fetchResource(objectType, objectId);
    }
  }, [objectState.status]);

  return null;
};

export const LTIUploadHandlers = () => {
  const { uploadManagerState } = useUploadManager();

  return (
    <React.Fragment>
      {Object.values(uploadManagerState).map((objectState) => (
        <UploadSuccessHandler
          key={objectState.objectId}
          objectState={objectState}
        />
      ))}
    </React.Fragment>
  );
};
