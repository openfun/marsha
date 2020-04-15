import { act, render } from '@testing-library/react';
import React from 'react';

import { DashboardObjectProgress } from '.';
import { useObjectProgress } from '../../data/stores/useObjectProgress';
import { wrapInIntlProvider } from '../../utils/tests/intl';

describe('<DashboardVideoPaneProgress />', () => {
  let setObjectProgress: any;
  const ControlComponent = () => {
    setObjectProgress = useObjectProgress((state) => state.setObjectProgress);
    return null;
  };

  it('renders and displays the current progress', () => {
    const { getByText } = render(
      wrapInIntlProvider(<DashboardObjectProgress objectId={'42'} />),
    );
    getByText('0%');

    render(<ControlComponent />);
    act(() => setObjectProgress('42', 51));
    getByText('51%');
  });
});
