"use strict";
const fs = require("fs");
const AWS = require("aws-sdk");

const presets = [
  "./presets/jpeg_144p.json",
  "./presets/jpeg_240p.json",
  "./presets/jpeg_480p.json",
  "./presets/jpeg_720p.json",
  "./presets/jpeg_1080p.json",
  "./presets/mp4_h264_144p_30fps_300kbps.json",
  "./presets/mp4_h264_240p_30fps_600kbps.json",
  "./presets/mp4_h264_480p_30fps_1200kbps.json",
  "./presets/mp4_h264_720p_30fps_2400kbps.json",
  "./presets/mp4_h264_1080p_30fps_5400kbps.json"
];

let response;

// Return MediaConvert regional account Endpoint
let createEndPoint = function() {
  const mediaconvert = new AWS.MediaConvert();
  response = new Promise((res, reject) => {
    mediaconvert.describeEndpoints(function(error, data) {
      if (error) reject(error);
      else res({ EndpointUrl: data.Endpoints[0].Url });
    });
  });
  return response;
};

// Create Custom MediaConvert presets
let createPreset = function(preset, url) {
  const mediaconvert = new AWS.MediaConvert({
    endpoint: url,
    region: process.env.AWS_REGION
  });
  return new Promise(function(res, reject) {
    let params = JSON.parse(fs.readFileSync(preset, "utf8"));
    // TODO: update does not work
    mediaconvert.createPreset(params, function(error, data) {
      if (error) reject(error);
      else {
        console.log("created preset: ", data.Preset.Name);
        res(data);
      }
    });
  });
};

let createPresets = function(event) {
  response = new Promise((res, reject) => {
    let promises = [];
    let url = event.EndPoint;

    presets.forEach(function(preset) {
      promises.push(createPreset(preset, url));
    });
    Promise.all(promises)
      .then(data => {
        // Return a list of the names of the presets that we created
        res({
          Presets: data.reduce((list, item) => {
            list.push(item.Preset.Name);
            return list;
          }, [])
        });
      })
      .catch(error => {
        reject(error);
      });
  });
  return response;
};

module.exports = {
  MediaConvertEndPoint: createEndPoint,
  MediaConvertPresets: createPresets
};
