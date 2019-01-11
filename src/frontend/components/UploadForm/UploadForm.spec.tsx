import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

const mockMakeFormData = jest.fn();
jest.doMock('../../utils/makeFormData/makeFormData', () => ({
  makeFormData: mockMakeFormData,
}));

jest.doMock('react-router-dom', () => ({
  Link: () => null,
  Redirect: () => {},
}));

import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { ROUTE as DASHBOARD_ROUTE } from '../Dashboard/Dashboard';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
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
    fetchMock.mock('/api/videos/ab42/upload-policy/', {});
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

  it('gets the policy from the API and uses it to upload the file', async () => {
    // 1st call: home API call to get the AWS upload policy
    fetchMock.mock(
      '/api/videos/ab42/upload-policy/',
      JSON.stringify({
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
        jwt={'some_token'}
        object={object}
        objectType={modelName.VIDEOS}
        updateObject={mockUpdateObject}
      />,
    );
    const componentInstance = wrapper.instance() as UploadForm;

    expect(fetchMock.lastCall()).toEqual([
      '/api/videos/ab42/upload-policy/',
      { headers: { Authorization: 'Bearer some_token' } },
    ]);

    await flushAllPromises();

    mockMakeFormData.mockReturnValue('form data body');
    componentInstance.setState({
      file: { stub: 'file', type: 'video/mp4' } as any,
    });
    componentInstance.upload();

    expect(mockUpdateObject).toHaveBeenCalledWith({
      description: '',
      id: 'ab42',
      title: '',
      upload_state: uploadState.UPLOADING,
    });
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
    expect(fetchMock.lastCall()).toEqual([
      'https://s3.aws.example.com/good-ol-bucket',
      { body: 'form data body', method: 'POST' },
    ]);

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

  it('redirects to /errors/policy when it fails to get the policy', async () => {
    fetchMock.mock('/api/videos/ab42/upload-policy/', {
      throws: 'invalid policy',
    });
    const wrapper = shallow(
      <UploadForm
        jwt={'some_token'}
        object={object}
        objectType={modelName.VIDEOS}
        updateObject={mockUpdateObject}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('policy'));
  });

  it('marks the object with an error state when it fails to upload the file', async () => {
    // 1st call: home API call to get the AWS upload policy
    fetchMock.mock(
      '/api/videos/ab42/upload-policy/',
      JSON.stringify({
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
    fetchMock.mock('https://s3.aws.example.com/good-ol-bucket', {
      throws: 'failed to upload file',
    });

    const wrapper = shallow(
      <UploadForm
        jwt={'some_token'}
        object={object}
        objectType={modelName.VIDEOS}
        updateObject={mockUpdateObject}
      />,
    );
    const componentInstance = wrapper.instance() as UploadForm;
    await flushAllPromises();
    componentInstance.setState({
      file: { stub: 'file', type: 'video/mp4' } as any,
    });
    componentInstance.upload();

    expect(mockUpdateObject).toHaveBeenCalledWith({
      description: '',
      id: 'ab42',
      title: '',
      upload_state: uploadState.ERROR,
    });
  });
});
