export class NotTurnPlayerError extends Error {
  readonly name: string = 'NotTurnPlayerError';
  readonly code: number = 400;
  readonly message: string = 'Not your turn.';

  constructor() {
    super();
  }
}
