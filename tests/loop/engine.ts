import { Erreur } from '@dldc/erreur';
import { engine, resolver } from '../../src/mod';
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

export const appEngine = engine<unknown>({
  schema,
  resolvers: [userResolver, appResolver],
  onError: (error) => {
    return error instanceof Erreur ? error.toJSON() : 'Unknown error';
  },
});
