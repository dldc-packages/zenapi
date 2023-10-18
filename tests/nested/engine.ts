import { Erreur } from '@dldc/erreur';
import { Key, engine, resolver } from '../../src/mod';
import { appSchema, login, maybePersonal } from './schema';

interface IUser {
  id: string;
  name: string;
  email: string;
}

const AuthenticatedKey = Key.create<IUser>('Authenticated');

const loginResolver = resolver(login.entity, [], (ctx) => {
  const user: IUser = {
    id: '123',
    name: 'User',
    email: 'user@example.com',
  };
  return ctx.with(AuthenticatedKey.Provider(user)).withValue({ user });
});

const maybePersonalResolver = resolver(maybePersonal.entity, [], (ctx) => {
  const user = ctx.get(AuthenticatedKey.Consumer);
  if (!user) {
    return null;
  }
  return {
    user,
    joinDate: new Date(),
  };
});

export const appEngine = engine<unknown>({
  schema: appSchema,
  resolvers: [loginResolver, maybePersonalResolver],
  onError: (error) => {
    return error instanceof Erreur ? error.toJSON() : 'Unknown error';
  },
});
