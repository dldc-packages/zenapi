import { entity } from '../../src/mod';

export const workspaceUserRoleType = entity.enum(['admin', 'user']);

export const meWorkspaceType = entity.object({
  id: entity.string(),
  name: entity.string(),
  tenant: entity.string(),
  role: workspaceUserRoleType,
});

export const settingsTypes = entity.object({
  appName: entity.string(),
  appVersion: entity.json<{ major: number; minor: number }>(),
});

export const meWorspacesType = entity.list(meWorkspaceType);

export const meUserPasswordType = entity.string();

export const meType = entity.object({
  id: entity.string(),
  name: entity.string(),
  email: entity.string(),
  displayName: entity.nullable(entity.string()),
  password: meUserPasswordType,
  workspaces: meWorspacesType,
});

export const authRequestType = entity.object({
  email: entity.string(),
  otpId: entity.string(),
});

export const authLogin = entity.input<{ email: string; otpId: string; otp: string }, typeof meType>(meType);

export const authLogout = entity.number();

export const authRequestOtp = entity.input<{ tenant?: string; email: string }, typeof authRequestType>(authRequestType);

export const auth = entity.object({
  login: authLogin,
  logout: authLogout,
  requestOtp: authRequestOtp,
});

export const storageType = entity.object({
  id: entity.string(),
  description: entity.string(),
});

export const workspaceType = entity.object({
  id: entity.string(),
  name: entity.string(),
  tenant: entity.string(),
  storages: entity.list(storageType),
});

export const workspaceByTenant = entity.input<string, typeof workspaceType>(workspaceType);
export const workspaceById = entity.input<string, typeof workspaceType>(workspaceType);

export const version = entity.string();

export const maybeMe = entity.nullable(meType);

export const appSchema = entity.object({
  version,
  settings: settingsTypes,
  auth,
  me: maybeMe,
  workspaces: entity.list(workspaceType),
  workspace: entity.object({
    byTenant: workspaceByTenant,
    byId: workspaceById,
  }),
});
