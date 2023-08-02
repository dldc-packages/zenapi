import { schema } from '../../src/mod';

export const workspaceUserRoleType = schema.enum(['admin', 'user']);

export const meWorkspaceType = schema.object({
  id: schema.string(),
  name: schema.string(),
  tenant: schema.string(),
  role: workspaceUserRoleType,
});

export const meWorspacesType = schema.list(meWorkspaceType);

export const meUserPasswordType = schema.string();

export const meType = schema.object({
  id: schema.string(),
  name: schema.string(),
  email: schema.string(),
  displayName: schema.nullable(schema.string()),
  password: meUserPasswordType,
  workspaces: meWorspacesType,
});

export const authRequestType = schema.object({
  email: schema.string(),
  otpId: schema.string(),
});

export const authLogin = schema.input<{ email: string; otpId: string; otp: string }, typeof meType>(meType);

export const authLogout = schema.number();

export const authRequestOtp = schema.input<{ tenant?: string; email: string }, typeof authRequestType>(authRequestType);

export const auth = schema.object({
  login: authLogin,
  logout: authLogout,
  requestOtp: authRequestOtp,
});

export const storageType = schema.object({
  id: schema.string(),
  description: schema.string(),
});

export const workspaceType = schema.object({
  id: schema.string(),
  name: schema.string(),
  tenant: schema.string(),
  storages: schema.list(storageType),
});

export const workspaceByTenant = schema.input<string, typeof workspaceType>(workspaceType);
export const workspaceById = schema.input<string, typeof workspaceType>(workspaceType);

export const version = schema.string();

export const maybeMe = schema.nullable(meType);

export const appSchema = schema.object({
  version,
  auth,
  me: maybeMe,
  workspaces: schema.list(workspaceType),
  workspace: schema.object({
    byTenant: workspaceByTenant,
    byId: workspaceById,
  }),
});
