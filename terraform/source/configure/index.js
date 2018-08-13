"use strict";
const mediaConvert = require("./media-convert.js");

exports.handler = function(event, context, callback) {
  console.log("Received event:", JSON.stringify(event, null, 2));

  mediaConvert[event.Resource](event)
    .then(data => {
      callback(null, data);
    })
    .catch(error => {
      callback(error);
    });
};
