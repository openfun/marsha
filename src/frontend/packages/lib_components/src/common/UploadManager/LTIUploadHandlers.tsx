/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React, { useEffect } from 'react';

import { getResource as fetchResource } from 'data/sideEffects/getResource';
import { updateResource } from 'data/sideEffects/updateResource';
import { addResource, getStoreResource } from 'data/stores/generics';

import { UploadManagerState, UploadManagerStatus, useUploadManager } from '.';

const UploadSuccessHandler = ({
  objectState,
}: {
  objectState: UploadManagerState[string];
}) => {
  useEffect(() => {
    (async () => {
      if (objectState.status === UploadManagerStatus.SUCCESS) {
        const { file, objectId, objectType } = objectState;
        const object = await getStoreResource(objectType, objectId);
        if (object && 'title' in object && !object.title) {
          // Add the new object with title and upload_state in the store
          // to replace the old state.
          await addResource(objectType, {
            ...object,
            title: file.name,
          });

          // Fetch the API to update the title resource.
          await updateResource(
            {
              ...object,
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
    })();
  }, [objectState]);

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
