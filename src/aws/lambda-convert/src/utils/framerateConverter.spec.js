const framerateConverter = require("./framerateConverter");

describe("src/utils/framerateConverter", () => {
  it("converts fps to denominator and numerator", () => {
    const fpsMapping = [
      {
        fps: "24",
        expectedConverted: {
          numerator: 24000,
          denominator: 1000,
        },
      },
      {
        fps: "25",
        expectedConverted: {
          numerator: 25000,
          denominator: 1000,
        },
      },
      {
        fps: "23.976",
        expectedConverted: {
          numerator: 24000,
          denominator: 1001,
        },
      },
      {
        fps: "29.970",
        expectedConverted: {
          numerator: 30000,
          denominator: 1001,
        },
      },
    ];

    fpsMapping.forEach(({ fps, expectedConverted }) => {
      expect(framerateConverter(fps)).toEqual(expectedConverted);
    });
  });
});
