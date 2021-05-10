import React, { createContext, useContext, useEffect, useState } from 'react';

import { initiateUpload } from '../../data/sideEffects/initiateUpload';
import { uploadFile } from '../../data/sideEffects/uploadFile';
import { AWSPresignedPost } from '../../types/AWSPresignedPost';
import { modelName } from '../../types/models';
import { makeFormData } from '../../utils/makeFormData/makeFormData';

export enum UploadManagerStatus {
  ERR_POLICY = 'policy_error',
  ERR_UPLOAD = 'upload_error',
  INIT = 'initialization',
  SUCCESS = 'success',
  UPLOADING = 'uploading',
}

export interface UploadManagerState {
  [key: string]: {
    file: File;
    objectType: modelName;
    objectId: string;
    progress: number;
    status: UploadManagerStatus;
  };
}

// Initialize the context with empty values and a setter that just throws.
export const UploadManagerContext = createContext<{
  uploadManagerState: UploadManagerState;
  setUploadState: React.Dispatch<React.SetStateAction<UploadManagerState>>;
}>({
  uploadManagerState: {},
  setUploadState: () => {
    // This should never be called until <UploadManager /> sets the actual initial value
    throw new Error('UploadManager is not ready to receive uploads.');
  },
});

/**
 * Provider for upload management.
 * Should wrap any component that makes use of the upload manager, either to perform uploads or
 * to read uploads state.
 */
export const UploadManager = ({ children }: React.PropsWithChildren<{}>) => {
  const [uploadManagerState, setUploadState] = useState<UploadManagerState>({});

  useEffect(() => {
    Object.values(uploadManagerState)
      .filter(({ status }) => status === UploadManagerStatus.INIT)
      .forEach(async (upload) => {
        const { file, objectId, objectType } = upload;

        let presignedPost: AWSPresignedPost;
        try {
          presignedPost = await initiateUpload(
            objectType,
            objectId,
            file!.name,
            file!.type,
          );
        } catch (error) {
          setUploadState((state) => ({
            ...state,
            [objectId]: {
              ...state[objectId],
              status: UploadManagerStatus.ERR_POLICY,
            },
          }));
          return;
        }

        // Use FormData to meet the requirement of a multi-part POST request for s3
        // NB: order of keys is important here, which is why we do not iterate over an object
        const formData = makeFormData.apply(null, [
          ...Object.keys(presignedPost.fields).map((key) => [
            key,
            presignedPost.fields[key],
          ]),
          ...(([modelName.VIDEOS, modelName.THUMBNAILS].includes(objectType)
            ? [['Content-Type', file!.type]]
            : []) as any),
          // Add the file after all of the text fields
          ['file', file!],
        ]);

        setUploadState((state) => ({
          ...state,
          [objectId]: {
            ...state[objectId],
            status: UploadManagerStatus.UPLOADING,
          },
        }));

        try {
          await uploadFile(presignedPost.url, formData, (progress: number) =>
            setUploadState((state) => ({
              ...state,
              [objectId]: { ...state[objectId], progress },
            })),
          );
        } catch (e) {
          setUploadState((state) => ({
            ...state,
            [objectId]: {
              ...state[objectId],
              status: UploadManagerStatus.ERR_UPLOAD,
            },
          }));
          return;
        }

        setUploadState((state) => ({
          ...state,
          [objectId]: {
            ...state[objectId],
            status: UploadManagerStatus.SUCCESS,
          },
        }));
      });
  }, [Object.keys(uploadManagerState).join('_')]);

  return (
    <UploadManagerContext.Provider
      value={{ uploadManagerState, setUploadState }}
    >
      {children}
    </UploadManagerContext.Provider>
  );
};

/**
 * Allow state consumers & uploaders to access the upload manager.
 */
export const useUploadManager = () => {
  const { uploadManagerState, setUploadState } =
    useContext(UploadManagerContext);

  const addUpload = (objectType: modelName, objectId: string, file: File) => {
    setUploadState((state) => ({
      ...state,
      [objectId]: {
        objectId,
        objectType,
        file,
        progress: 0,
        status: UploadManagerStatus.INIT,
      },
    }));
  };

  return { addUpload, uploadManagerState };
};
