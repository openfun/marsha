import { Status } from '../../../components/UploadForm';
import { AWSPolicy } from '../../../types/AWSPolicy';
import { modelName } from '../../../types/models';
import { UploadableObject, uploadState } from '../../../types/tracks';
import { makeFormData } from '../../../utils/makeFormData/makeFormData';
import { Maybe } from '../../../utils/types';
import { addResource } from '../../stores/generics';
import { initiateUpload } from '../initiateUpload';
import { updateResource } from '../updateResource';
import { uploadFile } from '../uploadFile';

export const upload = (
  setStatus: (status: Status) => void,
  notifyObjectUploadProgress: (progress: number) => void,
  objectType: modelName,
  object: Maybe<UploadableObject>,
) => async (file: Maybe<File>) => {
  // Do not trigger an upload if we did not receive a file object.
  if (!file) {
    return;
  }

  if (!object) {
    return setStatus('not_found_error');
  }

  let policy: AWSPolicy;
  try {
    policy = await initiateUpload(objectType, object.id);
  } catch (error) {
    return setStatus('policy_error');
  }

  // Use FormData to meet the requirement of a multi-part POST request for s3
  // NB: order of keys is important here, which is why we do not iterate over an object
  const formData = makeFormData.apply(null, [
    ['key', policy.key],
    ['acl', policy.acl],
    ...(([modelName.VIDEOS, modelName.THUMBNAIL].includes(objectType)
      ? [['Content-Type', file!.type]]
      : []) as any),
    ['X-Amz-Credential', policy.x_amz_credential],
    ['X-Amz-Algorithm', policy.x_amz_algorithm],
    ['X-Amz-Date', policy.x_amz_date],
    ['Policy', policy.policy],
    ['X-Amz-Signature', policy.x_amz_signature],
    // Add the file after all of the text fields
    ['file', file!],
  ]);

  try {
    // Update the state to reflect the in-progress upload (for the dashboard)
    // Useful for the Dashboard loader and help text.
    await addResource(objectType, {
      ...object,
      upload_state: uploadState.UPLOADING,
    });

    // This `setStatus` call, which results in a redirection from the upload form to the dashboard, needs to
    // happen **after** the video object has been updated. This is necessary to avoid an initial render of the
    // dashboard with outdated data (a "READY" video, instead of a "PROCESSING"/"UPLOADING" one).
    setStatus('uploading');

    await uploadFile(
      `https://${policy.s3_endpoint}/${policy.bucket}`,
      formData,
      notifyObjectUploadProgress,
    );

    if (object.hasOwnProperty('title')) {
      // Add the new object with title and upload_state in the store
      // to replace the old state.
      await addResource(objectType, {
        ...object,
        title: file.name,
        upload_state: uploadState.PROCESSING,
      });

      // Fetch the API to update the title resource.
      await updateResource(
        {
          ...object,
          title: file.name,
        },
        objectType,
      );
    } else {
      await addResource(objectType, {
        ...object,
        upload_state: uploadState.PROCESSING,
      });
    }
  } catch (error) {
    await addResource(objectType, {
      ...object,
      upload_state: uploadState.ERROR,
    });
  }
};
