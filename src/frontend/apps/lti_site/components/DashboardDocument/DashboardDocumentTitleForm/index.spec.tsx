import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { uploadState, useJwt } from 'lib-components';
import { documentMockFactory } from 'lib-components/tests';
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

    expect(screen.getByRole('textbox')).toHaveValue('document title');
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
    await userEvent.click(screen.getByText('Submit'));
    act(() =>
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

    expect(inputTitle).toHaveValue('updated document title');
    await screen.findByText('Title successfully updated');
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
    await userEvent.click(screen.getByText('Submit'));
    act(() =>
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

    expect(inputTitle).toHaveValue('updated document title');
    await screen.findByText('Title successfully updated');
  });

  it('fails to update document title', async () => {
    const deferred = new Deferred();

    fetchMock.mock('/api/documents/47/', deferred.promise, { method: 'PUT' });

    render(
      <DashboardDocumentTitleForm
        document={documentMockFactory({
          id: '47',
          title: 'document title',
        })}
      />,
    );

    await userEvent.type(screen.getByRole('textbox'), 'Bar.pdf');
    await userEvent.click(screen.getByText('Submit'));
    act(() => deferred.reject(400));

    expect(fetchMock.called('/api/documents/47/', { method: 'PUT' })).toBe(
      true,
    );

    await screen.findByText('Impossible to update the title. Try again later.');
  });
});
