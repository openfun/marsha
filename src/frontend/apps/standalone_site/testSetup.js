import '@testing-library/jest-dom';

global.use_jwt_persistence = true;
const { useJwt } = require('lib-components');

useJwt.setState({
  setDecodedJwt: () =>
    useJwt.setState({
      internalDecodedJwt: 'some-internalDecodedJwt',
    }),
});
