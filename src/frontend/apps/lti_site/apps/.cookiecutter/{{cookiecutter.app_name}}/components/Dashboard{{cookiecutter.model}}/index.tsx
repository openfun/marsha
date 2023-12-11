import { Box, Spinner, Text, ThemeType } from 'grommet';
import { ThemeContext } from 'grommet/contexts/ThemeContext/index';
import React, { Suspense, useRef } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Loader, useCurrentResourceContext } from 'lib-components';

import { {{cookiecutter.app_name}}AppData } from 'apps/{{cookiecutter.app_name}}/data/{{cookiecutter.app_name}}AppData';
import { use{{cookiecutter.model}} } from 'apps/{{cookiecutter.app_name}}/data/queries';

const messages = defineMessages({
  loading{{cookiecutter.model}}: {
    defaultMessage: 'Loading {{cookiecutter.model_lower}}...',
    description:
      'Accessible message for the spinner while loading the {{cookiecutter.model_lower}} in dashboard view.',
    id: 'component.Dashboard{{cookiecutter.model}}.loading{{cookiecutter.model}}',
  },
  load{{cookiecutter.model}}Success: {
    defaultMessage: '{{cookiecutter.model}} loaded.',
    description: 'Message when {{cookiecutter.model_lower}} is loaded.',
    id: 'component.Dashboard{{cookiecutter.model}}.load{{cookiecutter.model}}Success',
  },
  load{{cookiecutter.model}}Error: {
    defaultMessage: '{{cookiecutter.model}} not loaded!',
    description: 'Message when {{cookiecutter.model_lower}} failed to load.',
    id: 'component.Dashboard{{cookiecutter.model}}.load{{cookiecutter.model}}Error',
  },
});

// remove if no theme override is needed
const extendedTheme: ThemeType = {};

const Dashboard{{cookiecutter.model}} = () => {
  const [context] = useCurrentResourceContext();

  let canUpdate = context.permissions.can_update;

  const {{cookiecutter.model_lower}}RefetchInterval = useRef(5000);
  const { data: {{cookiecutter.model_lower}}, status: use{{cookiecutter.model}}Status } = use{{cookiecutter.model}}(
    {{cookiecutter.app_name}}AppData.{{cookiecutter.model_lower}}!.id,
    { refetchInterval: {{cookiecutter.model_lower}}RefetchInterval.current },
  );

  let content: JSX.Element;
  switch (use{{cookiecutter.model}}Status) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loading{{cookiecutter.model}}} />
        </Spinner>
      );
      break;

    case 'error':
      content = <FormattedMessage {...messages.load{{cookiecutter.model}}Error} />;
      break;

    case 'success':
      if (!canUpdate) {
        // Student dashboard
        content = (
          <Box>
            <FormattedMessage {...messages.load{{cookiecutter.model}}Success} />
            <Text>Student view</Text>
            <Text>{{'{'}}{{cookiecutter.model_lower}}.title}</Text>
            <Text>{{'{'}}{{cookiecutter.model_lower}}.description}</Text>
          </Box>
        );
      } else {
        // Instructor dashboard
        content = (
          <Box>
            <FormattedMessage {...messages.load{{cookiecutter.model}}Success} />
            <Text>Instructor view</Text>
            <Text>{{'{'}}{{cookiecutter.model_lower}}.title}</Text>
            <Text>{{'{'}}{{cookiecutter.model_lower}}.description}</Text>
          </Box>
        );
      }
      break;
  }

  return (
    <ThemeContext.Extend value={extendedTheme}>
      <Box align="center">
        <Suspense fallback={<Loader />}>{content}</Suspense>
      </Box>
    </ThemeContext.Extend>
  );
};

export default Dashboard{{cookiecutter.model}};
