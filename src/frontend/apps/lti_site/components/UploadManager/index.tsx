import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { initiateUpload } from 'data/sideEffects/initiateUpload';
import { uploadFile } from 'data/sideEffects/uploadFile';
import { AWSPresignedPost } from 'types/AWSPresignedPost';
import { modelName, uploadableModelName } from 'types/models';
import { makeFormData } from 'utils/makeFormData/makeFormData';
import { modelName as markdownModelName } from 'apps/markdown/types/models';
import { modelName as depositModelName } from 'apps/deposit/types/models';
import { modelName as bbbModelName } from 'apps/classroom/types/models';

export enum UploadManagerStatus {
  ERR_POLICY = 'policy_error',
  ERR_UPLOAD = 'upload_error',
  INIT = 'initialization',
  SUCCESS = 'success',
  UPLOADING = 'uploading',
}

export interface UploadingObject {
  file: File;
  objectType: uploadableModelName;
  objectId: string;
  progress: number;
  status: UploadManagerStatus;
}

export interface UploadManagerState {
  [key: string]: UploadingObject;
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
      .forEach(async ({ file, objectId, objectType }) => {
        let presignedPost: AWSPresignedPost;
        try {
          presignedPost = await initiateUpload(
            objectType,
            objectId,
            file.name,
            file.type,
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
        const formArguments: [string, string | File][] = [];
        formArguments.push(
          ...Object.keys(presignedPost.fields).map((key) => {
            const value: [string, string] = [key, presignedPost.fields[key]];
            return value;
          }),
        );
        if (
          [
            modelName.VIDEOS,
            modelName.THUMBNAILS,
            modelName.SHAREDLIVEMEDIAS,
            markdownModelName.MARKDOWN_IMAGES,
            depositModelName.DepositedFiles,
            bbbModelName.CLASSROOM_DOCUMENTS,
          ].includes(objectType)
        ) {
          formArguments.push(['Content-Type', file.type]);
        }
        formArguments.push(['file', file]);

        const formData = makeFormData.apply(null, formArguments);

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

  const addUpload = useCallback(
    (objectType: uploadableModelName, objectId: string, file: File) => {
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
    },
    [setUploadState],
  );

  const resetUpload = useCallback(
    (objectId: string) => {
      setUploadState((state) =>
        Object.keys(state)
          .filter((resourceId) => resourceId !== objectId)
          .reduce(
            (acc, resourceId) => ({ ...acc, [resourceId]: state[resourceId] }),
            {},
          ),
      );
    },
    [setUploadState],
  );

  return { addUpload, resetUpload, uploadManagerState };
};
