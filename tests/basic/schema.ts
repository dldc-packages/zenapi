import { enumeration, input, list, nil, record, string } from '../../src/mod';

export const workspaceUserRoleType = enumeration(['admin', 'user']);

export const meWorkspaceType = record({
  id: string(),
  name: string(),
  tenant: string(),
  role: workspaceUserRoleType,
});

export const meWorspacesType = list(meWorkspaceType);

export const meUserPasswordType = string();

export const meType = record({
  id: string(),
  name: string(),
  email: string(),
  password: meUserPasswordType,
  workspaces: meWorspacesType,
});

export const authRequestType = record({
  email: string(),
  otpId: string(),
});

export const authLogin = input<{ email: string; otpId: string; otp: string }, typeof meType>(meType);

export const authLogout = nil();

export const authRequestOtp = input<{ tenant?: string; email: string }, typeof authRequestType>(authRequestType);

export const auth = record({
  login: authLogin,
  logout: authLogout,
  requestOtp: authRequestOtp,
});

export const storageType = record({
  id: string(),
  description: string(),
});

export const workspaceType = record({
  id: string(),
  name: string(),
  tenant: string(),
  storages: list(storageType),
});

export const workspaceByTenant = input<string, typeof workspaceType>(workspaceType);
export const workspaceById = input<string, typeof workspaceType>(workspaceType);

export const version = string();

export const schema = record({
  version,
  auth,
  workspaces: list(workspaceType),
  workspace: record({
    byTenant: workspaceByTenant,
    byId: workspaceById,
  }),
});
