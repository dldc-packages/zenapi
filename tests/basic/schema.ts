import { FormiField } from '@dldc/formi';
import { enumeration, func, list, nil, record, string } from '../../src/ZenType';

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

const loginInput = {
  email: FormiField.string(),
  otpId: FormiField.string(),
  otp: FormiField.string(),
};

export const authLogin = func(loginInput, meType);

export const authLogout = nil();

const requestOtpInput = {
  tenant: FormiField.optionalString(),
  email: FormiField.string(),
};

export const authRequestOtp = func(requestOtpInput, authRequestType);

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

const workspaceInput = {
  id: FormiField.optionalString(),
  tenant: FormiField.optionalString(),
};

export const workspace = func(workspaceInput, workspaceType);

export const schema = record({
  auth,
  workspaces: list(workspaceType),
  workspace,
});
