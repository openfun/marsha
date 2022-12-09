const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    ['/api', '/account/api'],
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_API_BASE_URL,
      changeOrigin: true,
    }),
  );
};
