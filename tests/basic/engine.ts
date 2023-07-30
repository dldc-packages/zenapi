import { engine, implem } from '../../src/mod';
import { authLogin, meWorspacesType, schema, version } from './schema';

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

export const apiEngine = engine(schema, authLoginImplem, meWorspacesTypeImplem, versionImplem);
