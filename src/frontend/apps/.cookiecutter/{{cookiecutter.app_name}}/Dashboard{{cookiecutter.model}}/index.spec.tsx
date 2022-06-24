import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient } from 'react-query';

import { getDecodedJwt } from 'data/appData';
import { Deferred } from 'utils/tests/Deferred';
import {
  ltiInstructorTokenMockFactory,
  ltiStudentTokenMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';

import { {{cookiecutter.model_lower}}MockFactory } from 'apps/{{cookiecutter.app_name}}/utils/tests/factories';
import Dashboard{{cookiecutter.model}} from '.';

jest.mock('data/appData', () => ({
  appData: {
    modelName: '{{cookiecutter.model_name}}',
    resource: {
      id: '1',
    },
  },
  getDecodedJwt: jest.fn(),
}));

const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

jest.mock('apps/{{cookiecutter.app_name}}/data/{{cookiecutter.app_name}}AppData', () => ({
  {{cookiecutter.app_name}}AppData: {
    modelName: '{{cookiecutter.model_name}}',
    {{cookiecutter.model_lower}}: {
      id: '1',
    },
    jwt: 'token',
  },
}));

describe('<Dashboard{{cookiecutter.model}} />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('shows student dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory({
      id: '1',
    });
    const {{cookiecutter.model_lower}}Deferred = new Deferred();
    fetchMock.get('/api/{{cookiecutter.model_url_part}}/1/', {{cookiecutter.model_lower}}Deferred.promise);

    render(<Dashboard{{cookiecutter.model}} />);
    screen.getByText('Loading {{cookiecutter.model_lower}}...');
    {{cookiecutter.model_lower}}Deferred.resolve({{cookiecutter.model_lower}});
    await screen.findByText('{{cookiecutter.model}} loaded.');
    screen.getByText('Student view');
    screen.getByText({{cookiecutter.model_lower}}.title!);
    screen.getByText({{cookiecutter.model_lower}}.description!);
  });

  it('shows instructor dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiInstructorTokenMockFactory());
    const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory({
      id: '1',
    });
    const {{cookiecutter.model_lower}}Deferred = new Deferred();
    fetchMock.get('/api/{{cookiecutter.model_url_part}}/1/', {{cookiecutter.model_lower}}Deferred.promise);

    render(<Dashboard{{cookiecutter.model}} />);
    screen.getByText('Loading {{cookiecutter.model_lower}}...');
    {{cookiecutter.model_lower}}Deferred.resolve({{cookiecutter.model_lower}});
    await screen.findByText('{{cookiecutter.model}} loaded.');
    screen.getByText('Instructor view');
    screen.getByText({{cookiecutter.model_lower}}.title!);
    screen.getByText({{cookiecutter.model_lower}}.description!);
  });

  it('display error when no jwt exists', async () => {
    mockGetDecodedJwt.mockImplementation(() => {
      throw new Error('No jwt');
    });
    render(<Dashboard{{cookiecutter.model}} />);

    screen.getByText('Token Error');
  });

  it('shows an error message when it fails to get the {{cookiecutter.model_lower}}', async () => {
    mockGetDecodedJwt.mockReturnValue(ltiStudentTokenMockFactory());
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const {{cookiecutter.model_lower}}Deferred = new Deferred();
    fetchMock.get('/api/{{cookiecutter.model_url_part}}/1/', {{cookiecutter.model_lower}}Deferred.promise);

    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

    render(<Dashboard{{cookiecutter.model}} />, {
      queryOptions: { client: queryClient },
    });
    screen.getByText('Loading {{cookiecutter.model_lower}}...');
    {{cookiecutter.model_lower}}Deferred.resolve(500);
    await screen.findByText('{{cookiecutter.model}} not loaded!');
  });
});
