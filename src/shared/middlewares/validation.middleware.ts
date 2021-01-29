import * as transformer from 'class-transformer';
import * as validator from 'class-validator';

import _ from 'lodash';

import { Request, Response, NextFunction } from 'express';

import { InvalidInputError } from '../errors/validation.error';

/**
 * Validates req.body if it fits given target class' specifications
 */
export default <T>(targetClass: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!validator.isDefined(req.body)) {
      req.body = {};
    }

    const transformedBody = transformer.plainToClass(targetClass as any, req.body);

    const validationErrors = await validator.validate(transformedBody);

    if (validationErrors.length > 0) {
      const errors = validationErrors.map((error) => _.map(error.constraints, (value) => value)).flat();
      next(new InvalidInputError(errors.join(',')));
    }

    next();
  };
};
