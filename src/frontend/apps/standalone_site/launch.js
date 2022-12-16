const today = new Date();
let dateTime = `${today.getFullYear()}${
  today.getMonth() + 1
}${today.getDate()}`;
dateTime += `${today.getHours()}${today.getMinutes() + 1}${today.getSeconds()}`;

require('child_process').execSync(
  `cross-env REACT_APP_BUILD_ID=${dateTime} react-scripts ${
    process.env.REACT_TYPE === 'build' ? 'build' : 'start'
  }`,
  {
    stdio: [0, 1, 2],
  },
);
