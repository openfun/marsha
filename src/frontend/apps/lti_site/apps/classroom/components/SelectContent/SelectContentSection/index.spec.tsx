import { screen } from '@testing-library/react';
import React from 'react';

import { classroomMockFactory } from 'apps/classroom/utils/tests/factories';
import render from 'utils/tests/render';

import { SelectContentSection } from '.';

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays available classrooms', async () => {
    const classroom = classroomMockFactory();
    const mockSelectAddAndSelectContent = jest.fn();
    render(
      <SelectContentSection
        items={[classroom]}
        addAndSelectContent={mockSelectAddAndSelectContent}
        newLtiUrl="https://example.com/lti/classrooms/"
        lti_select_form_data={{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByText('Add a classroom');

    screen.getByTitle(`Select ${classroom.title}`);
  });
});
