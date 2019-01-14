import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

const mockMakeFormData = jest.fn();
jest.doMock('../../utils/makeFormData/makeFormData', () => ({
  makeFormData: mockMakeFormData,
}));

const mockInitiateUpload = jest.fn();
jest.doMock('../../data/sideEffects/initiateUpload/initiateUpload', () => ({
  initiateUpload: mockInitiateUpload,
}));

jest.doMock('react-router-dom', () => ({
  Link: () => null,
  Redirect: () => {},
}));

import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UploadForm } from './UploadForm';

const mockUpdateObject = jest.fn();

describe('UploadForm', () => {
  const object = {
    description: '',
    id: 'ab42',
    title: '',
    upload_state: 'pending',
  } as Video;

  beforeEach(jest.resetAllMocks);

  afterEach(fetchMock.restore);

  it('renders the form by default', () => {
    const wrapper = shallow(
      <UploadForm
        jwt={'some_token'}
        object={object}
        objectType={modelName.VIDEOS}
        updateObject={mockUpdateObject}
      />,
    );

    expect(wrapper.html()).toContain('Create a new video');
  });

  describe('upload()', () => {
    beforeEach(() => {
      // Mock formData building for easier testing
      mockMakeFormData.mockReturnValue('form data body');
    });

    it('gets the policy from the API and uses it to upload the file', async () => {
      // 1st call: home API call to get the AWS upload policy
      mockInitiateUpload.mockReturnValue(
        Promise.resolve({
          acl: 'policy##acl',
          bucket: 'good-ol-bucket',
          key: 'policy##key',
          policy: 'policy##policy',
          s3_endpoint: 's3.aws.example.com',
          x_amz_algorithm: 'policy##x_amz_algorithm',
          x_amz_credential: 'policy##x_amz_credential',
          x_amz_date: 'policy##x_amz_date',
          x_amz_signature: 'policy##x_amz_signature',
        }),
      );

      // 2nd call: AWS bucket multipart POST to upload the file
      fetchMock.mock('https://s3.aws.example.com/good-ol-bucket', {});

      const wrapper = shallow(
        <UploadForm
          jwt={'some token'}
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
      expect(fetchMock.lastCall()).toEqual([
        'https://s3.aws.example.com/good-ol-bucket',
        { body: 'form data body', method: 'POST' },
      ]);

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
      mockInitiateUpload.mockReturnValue(
        Promise.reject(new Error('Failed to initate upload.')),
      );

      const wrapper = shallow(
        <UploadForm
          jwt={'some token'}
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

      expect(fetchMock.lastCall()).toBeUndefined();
      expect(mockMakeFormData).not.toHaveBeenCalled();
      expect(mockUpdateObject).not.toHaveBeenCalled();
    });

    it('marks the object with an error state when it fails to upload the file', async () => {
      // 1st call succeeds: home API call to get the AWS upload policy
      mockInitiateUpload.mockReturnValue(
        Promise.resolve({
          acl: 'policy##acl',
          bucket: 'good-ol-bucket',
          key: 'policy##key',
          policy: 'policy##policy',
          s3_endpoint: 's3.aws.example.com',
          x_amz_algorithm: 'policy##x_amz_algorithm',
          x_amz_credential: 'policy##x_amz_credential',
          x_amz_date: 'policy##x_amz_date',
          x_amz_signature: 'policy##x_amz_signature',
        }),
      );

      // 2nd call fails: AWS bucket multipart POST to upload the file
      fetchMock.mock('https://s3.aws.example.com/good-ol-bucket', {
        throws: 'Failed to upload file.',
      });

      const wrapper = shallow(
        <UploadForm
          jwt={'some_token'}
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
      expect(fetchMock.lastCall()).toEqual([
        'https://s3.aws.example.com/good-ol-bucket',
        { body: 'form data body', method: 'POST' },
      ]);

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
