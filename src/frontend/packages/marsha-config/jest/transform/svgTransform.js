'use strict';
exports.__esModule = true;

var path = require('path');
function escapeFileName(str) {
  return 'svg-'
    .concat(path.basename(str, '.svg'))
    .split(/\W+/)
    .map(function (x) {
      return ''.concat(x.charAt(0).toUpperCase()).concat(x.slice(1));
    })
    .join('');
}

var transform = function (src, filePath) {
  if (path.extname(filePath) !== '.svg') {
    return src;
  }
  const assetFilename = JSON.stringify(path.basename(filePath));
  var name = escapeFileName(filePath);

  return {
    code: `const React = require('react');
      function ${name}(props) {
        return React.createElement(
          'svg',
          Object.assign({}, props, {
            'data-file-name': '${name}',
            children: ${assetFilename}
          })
        );
      }
      module.exports = ${name};
      `,
  };
};

exports['default'] = {
  process: transform,
};
