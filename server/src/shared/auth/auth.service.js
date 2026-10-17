import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

const BCRYPT_ROUNDS = 10;

export function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function signToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/** Inscription : le rôle est toujours STUDENT (les comptes enseignants sont créés par le seed ou un admin). */
export async function register({ firstName, lastName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw AppError.conflict('Un compte existe déjà avec cet email');
  }
  const user = await prisma.user.create({
    data: { firstName, lastName, email, passwordHash: await hashPassword(password), role: 'STUDENT' },
  });
  return { token: signToken(user), user: toPublicUser(user) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect');
  }
  return { token: signToken(user), user: toPublicUser(user) };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.unauthorized('Utilisateur introuvable');
  return toPublicUser(user);
}
