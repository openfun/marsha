import { act, fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { documentMockFactory, uploadState, useJwt } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { DashboardDocumentTitleForm } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    document: null,
  }),
}));

describe('DashboardDocumentTitleForm', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

  afterEach(() => fetchMock.restore());

  it('shows the title form', () => {
    render(
      <DashboardDocumentTitleForm
        document={documentMockFactory({
          id: '46',
          title: 'document title',
          upload_state: uploadState.READY,
        })}
      />,
    );

    const inputTitle = screen.getByRole('textbox');

    expect(inputTitle.value).toEqual('document title');
  });

  it('successfully update document title', async () => {
    const deferred = new Deferred();
    const document = documentMockFactory({
      id: '46',
      title: 'foo.pdf',
      upload_state: uploadState.READY,
    });

    fetchMock.mock('/api/documents/46/', deferred.promise, { method: 'PUT' });

    render(<DashboardDocumentTitleForm document={document} />);

    const inputTitle = screen.getByRole('textbox');

    fireEvent.change(inputTitle, {
      target: { value: 'updated document title' },
    });
    fireEvent.click(screen.getByText('Submit'));
    await act(async () =>
      deferred.resolve(
        JSON.stringify({
          ...document,
          title: 'updated document title',
        }),
      ),
    );
    expect(fetchMock.called('/api/documents/46/', { method: 'PUT' })).toBe(
      true,
    );

    expect(inputTitle.value).toEqual('updated document title');
    screen.getByText('Title successfully updated');
  });

  it('successfully update null document title', async () => {
    const deferred = new Deferred();
    const document = documentMockFactory({
      id: '46',
      title: null,
      upload_state: uploadState.READY,
    });

    fetchMock.mock('/api/documents/46/', deferred.promise, { method: 'PUT' });

    render(<DashboardDocumentTitleForm document={document} />);

    const inputTitle = screen.getByRole('textbox');

    fireEvent.change(inputTitle, {
      target: { value: 'updated document title' },
    });
    fireEvent.click(screen.getByText('Submit'));
    await act(async () =>
      deferred.resolve(
        JSON.stringify({
          ...document,
          title: 'updated document title',
        }),
      ),
    );
    expect(fetchMock.called('/api/documents/46/', { method: 'PUT' })).toBe(
      true,
    );

    expect(inputTitle.value).toEqual('updated document title');
    screen.getByText('Title successfully updated');
  });

  it('fails to update document title', async () => {
    const deferred = new Deferred();

    fetchMock.mock('/api/documents/47/', deferred.promise, { method: 'PUT' });

    const { container, getByText } = render(
      <DashboardDocumentTitleForm
        document={documentMockFactory({
          id: '47',
          title: 'document title',
        })}
      />,
    );

    const inputTitle = container.querySelector('#title');
    fireEvent.change(inputTitle!, { target: { value: 'Bar.pdf' } });
    fireEvent.click(getByText('Submit'));
    await act(async () => deferred.reject(400));

    expect(fetchMock.called('/api/documents/47/', { method: 'PUT' })).toBe(
      true,
    );

    getByText('Impossible to update the title. Try again later.');
  });
});
