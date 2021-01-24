import { Request, Response } from 'express';

export default (error: any, req: Request, res: Response) => {
  const code = error.status || error.code || (error.response && error.response.code) || 500;

  const message = {
    method: req.method,
    route: req.url,
    userAgent: req.headers['user-agent'],
    code,
    body: req.body || {},
    params: req.params || {},
    query: req.query || {},
    error,
  };

  req.log.error(message);

  res.status(code).send(error);
};
