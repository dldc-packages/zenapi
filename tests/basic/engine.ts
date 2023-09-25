import { InputDataKey, basicResolver, defaultResolvers, engine } from '../../src/mod';
import { appSchema, authLogin, maybeMe, meWorspacesType, version } from './schema';

const authLoginImplem = basicResolver(authLogin.entity, (ctx) => {
  const input = ctx.getOrFail(InputDataKey.Consumer);

  return {
    id: '123',
    email: input.email,
    name: 'User',
  };
});

const versionImplem = basicResolver(version.entity, () => {
  return '1.0.0';
});

const meWorspacesTypeImplem = basicResolver(meWorspacesType.entity, () => {
  throw new Error('Not implemented');
});

const maybeMeImple = basicResolver(maybeMe.entity, () => {
  return null;
});

export const appEngine = engine<null>({
  schema: appSchema,
  resolvers: [...defaultResolvers, authLoginImplem, meWorspacesTypeImplem, versionImplem, maybeMeImple],
  onError: () => null,
});
