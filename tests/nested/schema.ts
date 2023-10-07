import { entity } from '../../src/mod';

export const user = entity.object({
  id: entity.string(),
  name: entity.string(),
  email: entity.string(),
});

export const personal = entity.object({
  user,
  joinDate: entity.date(),
});

export const maybePersonal = entity.nullable(personal);

export const login = entity.input<{ email: string; password: string }, typeof personal>(personal);

export const appSchema = entity.object({
  personal: maybePersonal,
  login,
});
