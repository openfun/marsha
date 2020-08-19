exports.format = (msgs) => {
  return Object.entries(msgs).map(([id, msg]) => ({
    id,
    defaultMessage: msg.defaultMessage,
    description: msg.description,
  }));
};
