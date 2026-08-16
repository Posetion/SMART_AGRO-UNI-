import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schemas: Schemas | AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if ('parse' in schemas && typeof (schemas as AnyZodObject).parse === 'function' && !('body' in schemas)) {
      (schemas as AnyZodObject).parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    }

    const s = schemas as Schemas;
    if (s.body) req.body = s.body.parse(req.body);
    if (s.query) req.query = s.query.parse(req.query) as Request['query'];
    if (s.params) req.params = s.params.parse(req.params) as Request['params'];
    return next();
  };
}
