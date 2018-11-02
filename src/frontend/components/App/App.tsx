import * as React from 'react';

import { appData } from '../..';
import { Video } from '../../types/Video';

export const AppDataContext = React.createContext(appData);

/** App provides a simple dynamic state holder that lets us update the video in AppData.
 * If data management needs grow any further, we'll need to formalize this by using redux or a lighter
 * state management solution.
 */
export class App extends React.Component {
  state = { appData };

  constructor(props: {}) {
    super(props);
    this.state = {
      appData: { ...appData, updateVideo: this.updateVideo.bind(this) },
    };
  }

  updateVideo(video: Video) {
    this.setState({ appData: { ...appData, video } });
  }

  render() {
    return (
      <AppDataContext.Provider value={this.state.appData}>
        {this.props.children}
      </AppDataContext.Provider>
    );
  }
}
