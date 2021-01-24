import { Request, Response } from 'express';

import { NotFoundError } from '../errors/app.error';

export default (req: Request, res: Response) => {
  const error = new NotFoundError();
  res.status(error.code).send(error);
};
