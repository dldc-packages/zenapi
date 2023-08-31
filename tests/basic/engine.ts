import { InputDataKey, engine, resolver } from '../../src/mod';
import { appSchema, authLogin, maybeMe, meWorspacesType, version } from './schema';

const authLoginImplem = resolver(authLogin, (ctx) => {
  const input = ctx.getOrFail(InputDataKey.Consumer);

  return {
    id: '123',
    email: input.email,
    name: 'User',
  };
});

const versionImplem = resolver(version, () => {
  console.log('versionImplem');
  return '1.0.0';
});

const meWorspacesTypeImplem = resolver(meWorspacesType, () => {
  throw new Error('Not implemented');
});

const maybeMeImple = resolver(maybeMe, () => {
  return null;
});

export const appEngine = engine({
  schema: appSchema,
  entityResolvers: [authLoginImplem, meWorspacesTypeImplem, versionImplem, maybeMeImple],
});
