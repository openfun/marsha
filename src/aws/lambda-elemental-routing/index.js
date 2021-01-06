'use strict';

const medialive = require('./src/medialive');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  switch (event.source) {
    case 'aws.medialive':
      return medialive(event);
  }
};
