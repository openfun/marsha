import { IntlShape, createIntl } from 'react-intl';

import { userRoleOptions } from './UserRoleOptions';

describe('UserRoleOptions', () => {
  it('returns the expected options', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });
    const expectedOptions = [
      { label: 'Administrator', value: 'administrator' },
      { label: 'Instructor', value: 'instructor' },
      { label: 'Student', value: 'student' },
    ];
    expect(userRoleOptions(intl)).toEqual(expectedOptions);
  });
});
