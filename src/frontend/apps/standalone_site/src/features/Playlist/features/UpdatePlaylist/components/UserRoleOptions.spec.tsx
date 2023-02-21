import { createIntl, IntlShape } from 'react-intl';

import { userRoleOptions } from './UserRoleOptions';

describe('UserRoleOptions', () => {
  it('returns the expected options', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });
    const expectedOptions = [
      { label: 'Administrator', key: 'administrator' },
      { label: 'Instructor', key: 'instructor' },
      { label: 'Student', key: 'student' },
    ];
    expect(userRoleOptions(intl)).toEqual(expectedOptions);
  });
});
