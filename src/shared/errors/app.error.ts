export class NotFoundError extends Error {
  readonly name: string = 'NotFoundError';
  readonly code: number = 404;
  readonly message: string = 'The page you are looking for is not found.';

  constructor() {
    super();
  }
}

export class UnknownError extends Error {
  readonly name: string = 'UnknownError';
  readonly code: number = 500;
  readonly message: string = 'An unknown error is occured.';

  constructor() {
    super();
  }
}

export class UnauthorizedError extends Error {
  readonly name: string = 'UnauthorizedError';
  readonly code: number = 401;
  readonly message: string = 'You are not allowed to perform this action.';

  constructor() {
    super();
  }
}
