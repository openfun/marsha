import { act, fireEvent, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Grommet } from 'grommet';
import React from 'react';

import { DashboardDocumentTitleForm } from '.';
import { UploadState } from '../../types/tracks';
import { Deferred } from '../../utils/tests/Deferred';
import { documentMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: {
    document: null,
    jwt: 'cool_token_m8',
  },
}));

describe('DashboardDocumentTitleForm', () => {
  afterEach(() => fetchMock.restore());

  it('shows the title form', () => {
    const { container } = render(
      wrapInIntlProvider(
        <Grommet>
          <DashboardDocumentTitleForm
            document={documentMockFactory({
              id: '46',
              title: 'document title',
              upload_state: UploadState.READY,
            })}
          />
        </Grommet>,
      ),
    );

    const inputTitle = container.querySelector('#title') as HTMLInputElement;

    expect(inputTitle.value).toEqual('document title');
  });

  it('successfully update document title', async () => {
    const deferred = new Deferred();
    const document = documentMockFactory({
      id: '46',
      title: 'foo.pdf',
      upload_state: UploadState.READY,
    });

    fetchMock.mock('/api/documents/46/', deferred.promise, { method: 'PUT' });

    const { container, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <DashboardDocumentTitleForm document={document} />
        </Grommet>,
      ),
    );

    const inputTitle = container.querySelector('#title') as HTMLInputElement;

    fireEvent.change(inputTitle!, {
      target: { value: 'updated document title' },
    });
    fireEvent.click(getByText('Submit'));
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
    getByText('Title successfully updated');
  });

  it('fails to update document title', async () => {
    const deferred = new Deferred();

    fetchMock.mock('/api/documents/47/', deferred.promise, { method: 'PUT' });

    const { container, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <DashboardDocumentTitleForm
            document={documentMockFactory({
              id: '47',
              title: 'document title',
            })}
          />
        </Grommet>,
      ),
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
