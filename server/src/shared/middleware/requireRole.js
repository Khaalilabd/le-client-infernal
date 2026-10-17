// Restreint une route à un ou plusieurs rôles. À placer après authenticate.
// Exemple : router.get('/teacher', requireRole('TEACHER'), handler)
import { AppError } from '../errors/AppError.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Votre rôle ne permet pas cette action'));
    }
    return next();
  };
}
