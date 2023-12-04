import { screen } from '@testing-library/react';
import { markdownDocumentMockFactory } from 'lib-markdown/tests';
import { render } from 'lib-tests';
import React from 'react';

import { SelectContentSection } from '.';

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays available file depositories', () => {
    const markdown = markdownDocumentMockFactory();
    const mockSelectAddAndSelectContent = jest.fn();
    render(
      <SelectContentSection
        items={[markdown]}
        addAndSelectContent={mockSelectAddAndSelectContent}
        language="en"
        newLtiUrl="https://example.com/lti/deposit/"
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByText('Add a markdown document');

    expect(
      screen.getByLabelText(`Select ${markdown.translations[0].title}`),
    ).toBeInTheDocument();
  });
});
