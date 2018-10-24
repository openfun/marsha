import * as React from 'react';

const ReactRouter: any = jest.genMockFromModule('react-router-dom');

// Stub withRouter to just return the wrapped component
// This allows us to run shallow() and still get the Component itself directly.
ReactRouter.withRouter = (Component: React.ComponentClass) => Component;

module.exports = ReactRouter;
