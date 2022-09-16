module.exports = (framerate) => {
  const roundedFramerate = Math.round(framerate);
  const denominator = Math.round(
    ((1000 * roundedFramerate) / Math.round(framerate * 1000)) * 1000,
  );
  const numerator = 1000 * roundedFramerate;

  return {
    denominator,
    numerator,
  };
};
