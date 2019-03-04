import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

jest.mock('../../utils/makeFormData/makeFormData', () => ({
  makeFormData: jest.fn(),
}));

jest.mock('../../data/sideEffects/initiateUpload/initiateUpload', () => ({
  initiateUpload: jest.fn(),
}));

jest.mock('../../data/sideEffects/uploadFile/uploadFile', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Link: () => null,
  Redirect: () => {},
}));

import { initiateUpload } from '../../data/sideEffects/initiateUpload/initiateUpload';
import { uploadFile } from '../../data/sideEffects/uploadFile/uploadFile';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { makeFormData } from '../../utils/makeFormData/makeFormData';
import { jestMockOf } from '../../utils/types';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadForm } from './UploadForm';

const mockInitiateUpload: jestMockOf<
  typeof initiateUpload
> = initiateUpload as any;
const mockMakeFormData: jestMockOf<typeof makeFormData> = makeFormData as any;
const mockUploadFile: jestMockOf<typeof uploadFile> = uploadFile as any;

const mockUpdateObject = jest.fn();
const mockNotifyUploadProgress = jest.fn();

describe('UploadForm', () => {
  const object = {
    description: '',
    id: 'ab42',
    title: '',
    upload_state: 'pending',
  } as Video;

  beforeEach(jest.resetAllMocks);

  it('renders the form by default', () => {
    const wrapper = shallow(
      <UploadForm
        jwt={'some_token'}
        notifyObjectUploadProgress={mockNotifyUploadProgress}
        object={object}
        objectType={modelName.VIDEOS}
        updateObject={mockUpdateObject}
      />,
    );

    expect(
      wrapper
        .childAt(0)
        .childAt(0)
        .html(),
    ).toContain('Create a new video');
  });

  describe('upload()', () => {
    beforeEach(() => {
      // Mock formData building for easier testing
      mockMakeFormData.mockReturnValue('form data body' as any);
    });

    it('gets the policy from the API and uses it to upload the file', async () => {
      // Home API call to get the AWS upload policy
      mockInitiateUpload.mockResolvedValue({
        acl: 'policy##acl',
        bucket: 'good-ol-bucket',
        key: 'policy##key',
        policy: 'policy##policy',
        s3_endpoint: 's3.aws.example.com',
        x_amz_algorithm: 'policy##x_amz_algorithm',
        x_amz_credential: 'policy##x_amz_credential',
        x_amz_date: 'policy##x_amz_date',
        x_amz_signature: 'policy##x_amz_signature',
      });

      // AWS bucket multipart POST to upload the file
      mockUploadFile.mockResolvedValue(true);

      const wrapper = shallow(
        <UploadForm
          jwt={'some token'}
          notifyObjectUploadProgress={mockNotifyUploadProgress}
          object={object}
          objectType={modelName.VIDEOS}
          updateObject={mockUpdateObject}
        />,
      );

      (wrapper.instance() as UploadForm).upload({
        stub: 'file',
        type: 'video/mp4',
      } as any);

      expect(mockInitiateUpload).toHaveBeenCalledWith(
        'some token',
        modelName.VIDEOS,
        'ab42',
      );

      // Wait until the `initiate-upload` call has finished
      await flushAllPromises();

      expect(mockMakeFormData).toHaveBeenCalledWith(
        ['key', 'policy##key'],
        ['acl', 'policy##acl'],
        ['Content-Type', 'video/mp4'],
        ['X-Amz-Credential', 'policy##x_amz_credential'],
        ['X-Amz-Algorithm', 'policy##x_amz_algorithm'],
        ['X-Amz-Date', 'policy##x_amz_date'],
        ['Policy', 'policy##policy'],
        ['X-Amz-Signature', 'policy##x_amz_signature'],
        ['file', { stub: 'file', type: 'video/mp4' }],
      );
      expect(mockUpdateObject).toHaveBeenCalledWith({
        description: '',
        id: 'ab42',
        title: '',
        upload_state: uploadState.UPLOADING,
      });
      expect(mockUploadFile).toHaveBeenCalledWith(
        'https://s3.aws.example.com/good-ol-bucket',
        'form data body',
        mockNotifyUploadProgress,
      );

      // Wait until the S3 upload request has finished
      await flushAllPromises();

      expect(mockUpdateObject).toHaveBeenCalledWith({
        description: '',
        id: 'ab42',
        title: '',
        upload_state: uploadState.PROCESSING,
      });
      expect(wrapper.name()).toEqual('Redirect');
      expect(wrapper.prop('push')).toBeTruthy();
      expect(wrapper.prop('to')).toEqual(DASHBOARD_ROUTE());
    });

    it('redirects to /errors/policy when it fails to trigger initiate-upload', async () => {
      mockInitiateUpload.mockRejectedValue(
        new Error('Failed to initate upload.'),
      );

      const wrapper = shallow(
        <UploadForm
          jwt={'some token'}
          notifyObjectUploadProgress={mockNotifyUploadProgress}
          object={object}
          objectType={modelName.VIDEOS}
          updateObject={mockUpdateObject}
        />,
      );

      (wrapper.instance() as UploadForm).upload({
        stub: 'file',
        type: 'video/mp4',
      } as any);

      // Wait until the `initiate-upload` call has finished (and failed)
      await flushAllPromises();

      expect(wrapper.name()).toEqual('Redirect');
      expect(wrapper.prop('push')).toBeTruthy();
      expect(wrapper.prop('to')).toEqual(ERROR_COMPONENT_ROUTE('policy'));

      expect(mockMakeFormData).not.toHaveBeenCalled();
      expect(mockUpdateObject).not.toHaveBeenCalled();
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('marks the object with an error state when it fails to upload the file', async () => {
      // Succeeds: home API call to get the AWS upload policy
      mockInitiateUpload.mockResolvedValue({
        acl: 'policy##acl',
        bucket: 'good-ol-bucket',
        key: 'policy##key',
        policy: 'policy##policy',
        s3_endpoint: 's3.aws.example.com',
        x_amz_algorithm: 'policy##x_amz_algorithm',
        x_amz_credential: 'policy##x_amz_credential',
        x_amz_date: 'policy##x_amz_date',
        x_amz_signature: 'policy##x_amz_signature',
      });

      // Fails: AWS bucket multipart POST to upload the file
      mockUploadFile.mockRejectedValue(new Error('Failed to upload file.'));

      const wrapper = shallow(
        <UploadForm
          jwt={'some_token'}
          notifyObjectUploadProgress={mockNotifyUploadProgress}
          object={object}
          objectType={modelName.VIDEOS}
          updateObject={mockUpdateObject}
        />,
      );

      (wrapper.instance() as UploadForm).upload({
        stub: 'file',
        type: 'video/mp4',
      } as any);

      // Wait until the `initiate-upload` call has finished
      await flushAllPromises();

      // Upload proceeded as intended
      expect(mockMakeFormData).toHaveBeenCalledWith(
        ['key', 'policy##key'],
        ['acl', 'policy##acl'],
        ['Content-Type', 'video/mp4'],
        ['X-Amz-Credential', 'policy##x_amz_credential'],
        ['X-Amz-Algorithm', 'policy##x_amz_algorithm'],
        ['X-Amz-Date', 'policy##x_amz_date'],
        ['Policy', 'policy##policy'],
        ['X-Amz-Signature', 'policy##x_amz_signature'],
        ['file', { stub: 'file', type: 'video/mp4' }],
      );
      expect(mockUpdateObject).toHaveBeenCalledWith({
        description: '',
        id: 'ab42',
        title: '',
        upload_state: uploadState.UPLOADING,
      });
      expect(mockUploadFile).toHaveBeenCalledWith(
        'https://s3.aws.example.com/good-ol-bucket',
        'form data body',
        mockNotifyUploadProgress,
      );

      // Wait until the S3 upload request has finished (and failed)
      await flushAllPromises();

      expect(mockUpdateObject).toHaveBeenCalledWith({
        description: '',
        id: 'ab42',
        title: '',
        upload_state: uploadState.ERROR,
      });
    });
  });
});
