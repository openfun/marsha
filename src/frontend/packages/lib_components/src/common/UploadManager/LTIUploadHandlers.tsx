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
  const { status, file, objectId, objectType } = objectState;

  //  once upload on S3 is finished, push new state to backend
  useEffect(() => {
    (async () => {
      if (status !== UploadManagerStatus.SUCCESS) {
        return;
      }

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
    })();
  }, [file.name, objectId, objectType, status]);

  //  update the ressource beeing uploaded
  useEffect(() => {
    (async () => {
      if (status !== UploadManagerStatus.UPLOADING) {
        return;
      }

      await fetchResource(objectType, objectId);
    })();
  }, [objectId, objectType, status]);

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
