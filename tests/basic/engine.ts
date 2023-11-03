import { InputDataKey, basicResolver, createErrorBoundary, engine } from '../../src/mod';
import { appSchema, authLogin, maybeMe, meWorspacesType, unauthorized, version } from './schema';

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

const maybeMeImplem = basicResolver(maybeMe.entity, () => {
  return null;
});

const unauthorizedImplem = basicResolver(unauthorized.entity, () => {
  throw new Error('Unauthorized');
});

export type ErrorData = { message: string };

export const errorBoundary = createErrorBoundary<ErrorData>();

export const appEngine = engine({
  schema: appSchema,
  resolvers: [authLoginImplem, meWorspacesTypeImplem, versionImplem, maybeMeImplem, unauthorizedImplem],
  onError: (err): ErrorData => (err instanceof Error ? { message: err.message } : { message: 'Unknown error' }),
});
