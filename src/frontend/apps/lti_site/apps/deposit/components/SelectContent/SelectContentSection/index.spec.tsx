import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { fileDepositoryMockFactory } from 'apps/deposit/utils/tests/factories';

import { SelectContentSection } from '.';

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays available file depositories', () => {
    const deposit = fileDepositoryMockFactory();
    const mockSelectAddAndSelectContent = jest.fn();
    render(
      <SelectContentSection
        items={[deposit]}
        addAndSelectContent={mockSelectAddAndSelectContent}
        newLtiUrl="https://example.com/lti/deposit/"
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByText('Add a file depository');

    expect(
      screen.getByLabelText(`Select ${deposit.title!}`),
    ).toBeInTheDocument();
  });
});
