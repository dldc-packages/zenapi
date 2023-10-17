import type { IDeferredInstance, TLeafInstance, TObjectInstance } from '../../src/mod';
import { deferred, entity } from '../../src/mod';

type TUserEntity = TObjectInstance<{
  userName: TLeafInstance<string>;
  app: IDeferredInstance<TAppEntity>;
}>;

export const user: IDeferredInstance<TUserEntity> = deferred<TUserEntity>('user');

type TAppEntity = TObjectInstance<{
  appName: TLeafInstance<string>;
  user: IDeferredInstance<TUserEntity>;
}>;

export const app: IDeferredInstance<TAppEntity> = deferred<TAppEntity>('app');

app.define(
  entity.object({
    appName: entity.string(),
    user,
  }),
);

user.define(
  entity.object({
    userName: entity.string(),
    app,
  }),
);

export const schema = entity.namespace({
  user,
  app,
});
