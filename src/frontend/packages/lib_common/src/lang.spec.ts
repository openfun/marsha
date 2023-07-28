import { getIntl } from './lang';

describe('getIntl', () => {
  it('should create a new instance if a new config is provided', () => {
    const intlInstance1 = getIntl({ locale: 'fr', messages: {} });
    const intlInstance2 = getIntl({ locale: 'en', messages: {} });
    expect(intlInstance1).not.toBe(intlInstance2);
  });

  it('should return the intlInstance if it already exists and no new config is provided', () => {
    const intlInstance1 = getIntl({ locale: 'en', messages: {} });
    const intlInstance2 = getIntl();
    const intlInstance3 = getIntl();

    expect(intlInstance1).toBe(intlInstance2);
    expect(intlInstance3).toBe(intlInstance2);
  });

  it('should not create instance if the same config is provided', () => {
    const config = {
      locale: 'en',
      messages: {},
    };
    const intlInstance1 = getIntl(config);
    const intlInstance2 = getIntl(config);
    expect(intlInstance1).toBe(intlInstance2);
  });
});
