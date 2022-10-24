// To use for default statement in switch where all cases must be covered
export class ShouldNotHappen extends Error {
  constructor(val: never) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    super(`this should not happen: ${val}`);
  }
}
