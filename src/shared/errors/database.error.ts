export class DatabaseActionError extends Error {
  readonly name: string = 'DatabaseActionError';
  readonly code: number = 500;
  readonly message: string = 'Cannot perform database action.';

  constructor() {
    super();
  }
}

export class MissingRecordError extends Error {
  readonly name: string = 'MissingRecordError';
  readonly code: number = 500;

  constructor(queryInformation: Record<any, any>) {
    super();
    this.message = `Cannot find any document matches given information ${JSON.stringify(queryInformation)}.`;
  }
}
