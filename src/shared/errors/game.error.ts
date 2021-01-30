export class NotTurnPlayerError extends Error {
  readonly name: string = 'NotTurnPlayerError';
  readonly code: number = 400;
  readonly message: string = 'Not your turn.';

  constructor() {
    super();
  }
}

export class SelectedEmptyPitError extends Error {
  readonly name: string = 'SelectedEmptyPitError';
  readonly code: number = 400;
  readonly message: string = 'You selected an empty pit.';

  constructor() {
    super();
  }
}
