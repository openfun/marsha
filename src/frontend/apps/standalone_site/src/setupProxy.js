const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    ['/api', '/account/api', '/data/videos/'],
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_API_BASE_URL,
    }),
  );
  app.use(
    createProxyMiddleware('/ws/', {
      target: process.env.REACT_APP_BACKEND_WS_BASE_URL,
      ws: true,
    }),
  );
};
