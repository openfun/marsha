import React, { ComponentProps } from 'react';
import { Story } from '@storybook/react';

import { ErrorMessage } from './index';

// 👇 This default export determines where your story goes in the story list
export default {
  title: 'Components/ErrorMessage',
  component: ErrorMessage,
};

// 👇 We create a “template” of how args map to rendering
const Template: Story<ComponentProps<typeof ErrorMessage>> = (args) => (
  <ErrorMessage {...args} />
);

export const FirstStory = Template.bind({});

FirstStory.args = {
  code: 'lti',
};
