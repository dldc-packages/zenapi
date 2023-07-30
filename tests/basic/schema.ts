import { schema } from '../../src/mod';

export const workspaceUserRoleType = schema.enum(['admin', 'user']);

export const meWorkspaceType = schema.record({
  id: schema.string(),
  name: schema.string(),
  tenant: schema.string(),
  role: workspaceUserRoleType,
});

export const meWorspacesType = schema.list(meWorkspaceType);

export const meUserPasswordType = schema.string();

export const meType = schema.record({
  id: schema.string(),
  name: schema.string(),
  email: schema.string(),
  password: meUserPasswordType,
  workspaces: meWorspacesType,
});

export const authRequestType = schema.record({
  email: schema.string(),
  otpId: schema.string(),
});

export const authLogin = schema.input<{ email: string; otpId: string; otp: string }, typeof meType>(meType);

export const authLogout = schema.nil();

export const authRequestOtp = schema.input<{ tenant?: string; email: string }, typeof authRequestType>(authRequestType);

export const auth = schema.record({
  login: authLogin,
  logout: authLogout,
  requestOtp: authRequestOtp,
});

export const storageType = schema.record({
  id: schema.string(),
  description: schema.string(),
});

export const workspaceType = schema.record({
  id: schema.string(),
  name: schema.string(),
  tenant: schema.string(),
  storages: schema.list(storageType),
});

export const workspaceByTenant = schema.input<string, typeof workspaceType>(workspaceType);
export const workspaceById = schema.input<string, typeof workspaceType>(workspaceType);

export const version = schema.string();

export const appSchema = schema.record({
  version,
  auth,
  workspaces: schema.list(workspaceType),
  workspace: schema.record({
    byTenant: workspaceByTenant,
    byId: workspaceById,
  }),
});
