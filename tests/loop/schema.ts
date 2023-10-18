import type { TLeafInstance, TObjectInstance } from '../../src/mod';
import { deferred, entity } from '../../src/mod';

type TUserEntity = TObjectInstance<{
  userName: TLeafInstance<string>;
  app: TAppEntity;
}>;

export const [user, defineUser] = deferred<TUserEntity>('user');

type TAppEntity = TObjectInstance<{
  appName: TLeafInstance<string>;
  user: TUserEntity;
}>;

export const [app, definedApp] = deferred<TAppEntity>('app');

definedApp(
  entity.object({
    appName: entity.string(),
    user,
  }),
);

defineUser(
  entity.object({
    userName: entity.string(),
    app,
  }),
);

export const schema = entity.namespace({
  user,
  app,
});
