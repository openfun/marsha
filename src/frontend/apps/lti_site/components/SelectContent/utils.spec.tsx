import { buildContentItems } from './utils';

const mockSetContentItemsValue = jest.fn();

describe('buildContentItems', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('builds content items from title and description', () => {
    buildContentItems(
      'https://example.com/lti',
      'Custom select content title',
      'Custom select content description',
      {},
      mockSetContentItemsValue,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti',
            frame: [],
            title: 'Custom select content title',
            text: 'Custom select content description',
          },
        ],
      }),
    );
  });

  it('builds content items from lti select form data', () => {
    buildContentItems(
      'https://example.com/lti',
      null,
      null,
      {
        activity_title: 'lti activity title',
        activity_description: 'lti activity description',
      },
      mockSetContentItemsValue,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti',
            frame: [],
            title: 'lti activity title',
            text: 'lti activity description',
          },
        ],
      }),
    );
  });

  it('uses lti select form data othe title and description', () => {
    buildContentItems(
      'https://example.com/lti',
      'Custom select content title',
      'Custom select content description',
      {
        activity_title: 'lti activity title',
        activity_description: 'lti activity description',
      },
      mockSetContentItemsValue,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti',
            frame: [],
            title: 'lti activity title',
            text: 'lti activity description',
          },
        ],
      }),
    );
  });
});
