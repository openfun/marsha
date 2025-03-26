const request = require("request-promise-native");
const crypto = require("crypto");

const computeSignature = (secret, message) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);
  return hmac.digest("hex");
};

const sendRequest = async (
  body,
  signature,
  strictSSL,
  uri,
  method = "POST",
) => {
  return request({
    body,
    headers: {
      "X-Marsha-Signature": signature,
    },
    json: true,
    method,
    strictSSL,
    uri,
  });
};

module.exports = {
  computeSignature,
  sendRequest,
};
