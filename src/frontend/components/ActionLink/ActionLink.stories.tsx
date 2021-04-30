import React, { ComponentProps } from 'react';
import { Story } from '@storybook/react';

import { ActionLink } from './ActionLink';
import { theme } from '../../utils/theme/theme';

// 👇 This default export determines where your story goes in the story list
export default {
  title: 'Components/ActionLink',
  component: ActionLink,
  argTypes: {
    color: {
      control: {
        type: 'select',
      },
      options: Object.keys(theme.global.colors),
    },
  },
};

// 👇 We create a “template” of how args map to rendering
const Template: Story<ComponentProps<typeof ActionLink>> = (args) => (
  <ActionLink {...args} />
);

export const FirstStory = Template.bind({});

FirstStory.args = {
  label: 'link label',
  color: 'text',
};
