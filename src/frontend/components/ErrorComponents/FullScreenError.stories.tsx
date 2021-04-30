import React, { ComponentProps } from 'react';
import { Story } from '@storybook/react';
import { FullScreenError } from './index';

// 👇 This default export determines where your story goes in the story list
export default {
  title: 'Components/FullScreenError',
  component: FullScreenError,
};

// 👇 We create a “template” of how args map to rendering
const Template: Story<ComponentProps<typeof FullScreenError>> = (args) => (
  <FullScreenError {...args} />
);

export const FirstStory = Template.bind({});

FirstStory.args = {
  code: 'lti',
};
