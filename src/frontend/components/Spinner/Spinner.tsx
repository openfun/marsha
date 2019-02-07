import { Meter } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import * as React from 'react';

import { theme } from '../../utils/theme/theme';

interface SpinnerState {
  value: number;
}

export class Spinner extends React.Component<{}, SpinnerState> {
  state = { value: 0 };
  timer: number | undefined = undefined;

  componentDidMount() {
    this.timer = window.setInterval(() => {
      this.setState((prevState: SpinnerState) => {
        let value: number = prevState.value + 1;
        if (value > 100) {
          value = 0;
        }

        return { value };
      });
    }, 10);
  }

  componentWillUnmount() {
    window.clearInterval(this.timer);
  }

  render() {
    return (
      <Meter
        type="circle"
        values={
          [
            {
              background: normalizeColor('brand', theme),
              label: `Spinner-${this.state.value}`,
              value: this.state.value,
            },
          ] as any
        }
      />
    );
  }
}
