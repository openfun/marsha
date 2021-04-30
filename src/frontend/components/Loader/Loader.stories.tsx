import React, { ComponentProps } from 'react';
import { Story } from '@storybook/react';

import { Loader } from './index';

// 👇 This default export determines where your story goes in the story list
export default {
  title: 'Components/Loader',
  component: Loader,
};

// 👇 We create a “template” of how args map to rendering
const Template: Story<ComponentProps<typeof Loader>> = (args) => (
  <Loader {...args} />
);

export const FirstStory = Template.bind({});

FirstStory.args = {
  'aria-hidden': false,
  role: 'status',
  size: 'medium',
};
