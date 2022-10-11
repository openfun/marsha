import { Nullable } from 'lib-common';

interface ContentItemsStructure {
  '@context': string;
  '@graph': {
    '@type': string;
    url: string;
    title?: Nullable<string>;
    text?: Nullable<string>;
    frame: [];
  }[];
}

export const buildContentItems = (
  ltiUrl: string,
  title: Nullable<string>,
  description: Nullable<string>,
  ltiSelectFormData: {
    [key: string]: string;
  },
  setContentItemsValue: (value: string) => void,
) => {
  const contentItems: ContentItemsStructure = {
    '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
    '@graph': [
      {
        '@type': 'ContentItem',
        url: ltiUrl,
        frame: [],
      },
    ],
  };

  if (title) {
    contentItems['@graph'][0].title = title;
  }
  if (description) {
    contentItems['@graph'][0].text = description;
  }

  if (ltiSelectFormData?.activity_title) {
    contentItems['@graph'][0].title = ltiSelectFormData?.activity_title;
  }
  if (ltiSelectFormData?.activity_description) {
    contentItems['@graph'][0].text = ltiSelectFormData?.activity_description;
  }

  setContentItemsValue(JSON.stringify(contentItems));
};
