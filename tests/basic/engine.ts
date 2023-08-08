import { engine, implem } from '../../src/mod';
import { appSchema, authLogin, maybeMe, meWorspacesType, version } from './schema';

const authLoginImplem = implem(authLogin, ({ def }) => {
  return {
    id: '123',
    email: def.input.email,
    name: 'User',
  };
});

const versionImplem = implem(version, () => {
  return '1.0.0';
});

const meWorspacesTypeImplem = implem(meWorspacesType, () => {
  throw new Error('Not implemented');
});

const maybeMeImple = implem(maybeMe, () => {
  return null;
});

export const appEngine = engine({
  schema: appSchema,
  implems: [authLoginImplem, meWorspacesTypeImplem, versionImplem, maybeMeImple],
});
