import { screen } from '@testing-library/react';
import React from 'react';

import { {{cookiecutter.model_lower}}MockFactory } from 'apps/{{ cookiecutter.app_name }}/utils/tests/factories';
import render from 'utils/tests/render';

import { SelectContentSection } from '.';

const mockSetContentItemsValue = jest.fn();

describe('<SelectContentResource />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays available file depositories', async () => {
    const {{cookiecutter.model_lower}} = {{cookiecutter.model_lower}}MockFactory();
    const mockSelectAddAndSelectContent = jest.fn();
    render(
      <SelectContentSection
        items={[{{cookiecutter.model_lower}}]}
        addAndSelectContent={mockSelectAddAndSelectContent}
        newLtiUrl="https://example.com/lti/{{ cookiecutter.model_url_part }}/"
        lti_select_form_data={{'{'}}{
          lti_response_url: 'https://example.com/lti',
          lti_message_type: 'ContentItemSelection',
        }}
        setContentItemsValue={mockSetContentItemsValue}
      />,
    );

    screen.getByText('Add a {{cookiecutter.model_lower}}');

    screen.getByTitle(`Select ${{'{'}}{{cookiecutter.model_lower}}.title}`);
  });
});
