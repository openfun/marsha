import { Maybe } from '@lib-common/types';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { initiateUpload } from '@lib-components/data/sideEffects/initiateUpload';
import { uploadFile } from '@lib-components/data/sideEffects/uploadFile';
import { AWSPresignedPost } from '@lib-components/types/AWSPresignedPost';
import { ClassroomModelName } from '@lib-components/types/apps/classroom/models';
import { FileDepositoryModelName } from '@lib-components/types/apps/deposit/models';
import { MarkdownDocumentModelName } from '@lib-components/types/apps/markdown/models';
import { modelName, uploadableModelName } from '@lib-components/types/models';
import { makeFormData } from '@lib-components/utils/makeFormData/makeFormData';

export enum UploadManagerStatus {
  ERR_POLICY = 'policy_error',
  ERR_UPLOAD = 'upload_error',
  ERR_SIZE = 'size_error',
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
  message?: string;
  parentId?: string;
  onUploadEnded?: (presignedPost: AWSPresignedPost) => Promise<void> | void;
}

export interface UploadManagerState {
  [key: string]: UploadingObject;
}

export interface ApiException {
  type: string;
  data: { [key: string]: string };
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
export const UploadManager = ({
  children,
}: React.PropsWithChildren<unknown>) => {
  const [uploadManagerState, setUploadState] = useState<UploadManagerState>({});
  const [newUpload, setNewUpload] = useState(false);

  const uploadManagerKey = Object.keys(uploadManagerState).join('_');

  //  when list of download changes, check for new uploads
  useEffect(() => {
    setNewUpload(true);
  }, [uploadManagerKey]);

  //  upload process
  useEffect(() => {
    if (!newUpload || !Object.keys(uploadManagerState).length) {
      return;
    }

    setNewUpload(false);

    Object.values(uploadManagerState)
      .filter(({ status }) => status === UploadManagerStatus.INIT)
      .forEach(({ file, objectId, objectType, parentId, onUploadEnded }) => {
        (async () => {
          let presignedPost: AWSPresignedPost;
          try {
            presignedPost = await initiateUpload(
              objectType,
              objectId,
              file.name,
              file.type,
              file.size,
              parentId,
            );
          } catch (error) {
            if ((error as ApiException).type === 'SizeError') {
              setUploadState((state) => ({
                ...state,
                [objectId]: {
                  ...state[objectId],
                  status: UploadManagerStatus.ERR_SIZE,
                  message: (error as ApiException).data['size'],
                },
              }));
              return;
            }

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
              MarkdownDocumentModelName.MARKDOWN_IMAGES,
              FileDepositoryModelName.DepositedFiles,
              ClassroomModelName.CLASSROOM_DOCUMENTS,
            ].includes(objectType)
          ) {
            formArguments.push(['Content-Type', file.type]);
          }
          formArguments.push(['file', file]);

          const formData = makeFormData(...formArguments);

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
            onUploadEnded?.(presignedPost);
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
        })();
      });
  }, [uploadManagerState, newUpload]);

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
    (
      objectType: uploadableModelName,
      objectId: string,
      file: File,
      parentId?: Maybe<string>,
      onUploadEnded?: (presignedPost: AWSPresignedPost) => Promise<void> | void,
    ) => {
      setUploadState((state) => ({
        ...state,
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.INIT,
          parentId,
          onUploadEnded,
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
