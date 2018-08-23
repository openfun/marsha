import '../../testSetup';

import { render } from 'enzyme';
import * as React from 'react';
import { IntlProvider } from 'react-intl';

import { ErrorComponent } from './ErrorComponent';

test('ErrorComponent displays the content for 404 not found errors', () => {
  const wrapper = render(
    <IntlProvider locale="en">
      <ErrorComponent code="not_found" />
    </IntlProvider>,
  );
  expect(wrapper.text()).toContain(
    'The video you are looking for could not be found',
  );
  expect(wrapper.text()).toContain(
    'This video does not exist or has not been published yet',
  );
});

test('ErrorComponent displays the content for lti related errors', () => {
  const wrapper = render(
    <IntlProvider locale="en">
      <ErrorComponent code="lti" />
    </IntlProvider>,
  );
  expect(wrapper.text()).toContain('There was an error loading this video');
  expect(wrapper.text()).toContain(
    'We could not validate your access to this video',
  );
});
