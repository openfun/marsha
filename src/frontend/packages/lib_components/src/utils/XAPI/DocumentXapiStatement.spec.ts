import fetchMock from 'fetch-mock';
import { XAPI_ENDPOINT } from 'lib-components';

import { VerbDefinition } from 'types/XAPI';

import { DocumentXapiStatement } from './DocumentXapiStatement';

describe('DocumentXapiStatement', () => {
  afterEach(() => fetchMock.reset());

  it('sends a downloaded statement', () => {
    fetchMock.mock(`${XAPI_ENDPOINT}/document/`, 204);

    const xapiStatement = new DocumentXapiStatement('jwt', 'abcd');
    xapiStatement.downloaded();

    const lastCall = fetchMock.lastCall(`${XAPI_ENDPOINT}/document/`);

    const requestParameters = lastCall![1]!;

    expect(requestParameters.headers).toEqual({
      Authorization: 'Bearer jwt',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(requestParameters.body as string);

    expect(body.verb.id).toEqual(VerbDefinition.downloaded);
    expect(body.verb.display).toEqual({
      'en-US': 'downloaded',
    });
    expect(body.context.extensions).toEqual({
      'https://w3id.org/xapi/cmi5/context/extensions/sessionid': 'abcd',
    });
    expect(body).toHaveProperty('id');
  });
});
