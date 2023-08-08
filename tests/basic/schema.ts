import { models } from '../../src/mod';

export const workspaceUserRoleType = models.enum(['admin', 'user']);

export const meWorkspaceType = models.object({
  id: models.string(),
  name: models.string(),
  tenant: models.string(),
  role: workspaceUserRoleType,
});

export const settingsTypes = models.object({
  appName: models.string(),
  appVersion: models.json<{ major: number; minor: number }>(),
});

export const meWorspacesType = models.list(meWorkspaceType);

export const meUserPasswordType = models.string();

export const meType = models.object({
  id: models.string(),
  name: models.string(),
  email: models.string(),
  displayName: models.nullable(models.string()),
  password: meUserPasswordType,
  workspaces: meWorspacesType,
});

export const authRequestType = models.object({
  email: models.string(),
  otpId: models.string(),
});

export const authLogin = models.input<{ email: string; otpId: string; otp: string }, typeof meType>(meType);

export const authLogout = models.number();

export const authRequestOtp = models.input<{ tenant?: string; email: string }, typeof authRequestType>(authRequestType);

export const auth = models.object({
  login: authLogin,
  logout: authLogout,
  requestOtp: authRequestOtp,
});

export const storageType = models.object({
  id: models.string(),
  description: models.string(),
});

export const workspaceType = models.object({
  id: models.string(),
  name: models.string(),
  tenant: models.string(),
  storages: models.list(storageType),
});

export const workspaceByTenant = models.input<string, typeof workspaceType>(workspaceType);
export const workspaceById = models.input<string, typeof workspaceType>(workspaceType);

export const version = models.string();

export const maybeMe = models.nullable(meType);

export const appSchema = models.object({
  version,
  settings: settingsTypes,
  auth,
  me: maybeMe,
  workspaces: models.list(workspaceType),
  workspace: models.object({
    byTenant: workspaceByTenant,
    byId: workspaceById,
  }),
});
