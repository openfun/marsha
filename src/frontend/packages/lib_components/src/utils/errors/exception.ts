/* eslint-disable @typescript-eslint/restrict-template-expressions */
// To use for default statement in switch where all cases must be covered
export class ShouldNotHappen extends Error {
  constructor(val: never) {
    super(`this should not happen: ${val}`);
  }
}
