export class InvalidInputError extends Error {
  readonly name: string = 'InvalidInputError';
  readonly code: number = 400;

  constructor(message: string) {
    super();
    this.message = message;
  }
}
