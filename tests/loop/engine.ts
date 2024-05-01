import { ZenapiErreur, engine, resolver } from '../../src/mod';
import { app, schema, user } from './schema';

const userResolver = resolver(user.entity, [], () => {
  return {
    userName: 'User',
  };
});

const appResolver = resolver(app.entity, [], () => {
  return {
    appName: 'App',
  };
});

export const appEngine = engine({
  schema,
  resolvers: [userResolver, appResolver],
  onError: (error) => {
    return ZenapiErreur.get(error) ?? 'Unknown error';
  },
});
