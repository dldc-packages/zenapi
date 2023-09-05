import { InputDataKey, defaultResolvers, engine, resolver } from '../../src/mod';
import { appSchema, authLogin, maybeMe, meWorspacesType, version } from './schema';

const authLoginImplem = resolver(authLogin.entity, (ctx) => {
  const input = ctx.getOrFail(InputDataKey.Consumer);

  return {
    id: '123',
    email: input.email,
    name: 'User',
  };
});

const versionImplem = resolver(version.entity, () => {
  return '1.0.0';
});

const meWorspacesTypeImplem = resolver(meWorspacesType.entity, () => {
  throw new Error('Not implemented');
});

const maybeMeImple = resolver(maybeMe.entity, () => {
  return null;
});

export const appEngine = engine({
  schema: appSchema,
  resolvers: [...defaultResolvers, authLoginImplem, meWorspacesTypeImplem, versionImplem, maybeMeImple],
});
