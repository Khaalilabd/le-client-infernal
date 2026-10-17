// Validation Zod des entrées HTTP.
// Exemple : router.post('/', validate({ body: mySchema }), handler)
// Les données validées sont disponibles dans req.valid.body / req.valid.params / req.valid.query.
import { AppError } from '../errors/AppError.js';
import { formatZodIssues } from '../errors/errorHandler.js';

export function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    for (const part of ['body', 'params', 'query']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        return next(new AppError(400, 'VALIDATION_ERROR', 'Données invalides', formatZodIssues(result.error)));
      }
      req.valid[part] = result.data;
    }
    return next();
  };
}
