# ZenAPI

## Types

### Primitive

- `string()`
- `number()`
- `boolean()`
- `nil()`

### Enum `enum(['first', ...])`

### Record `record({ key: type, ... })`

A record is a set of keys that map to a `Type`

### List `list(type)`

A list of another `Type`

### Ref `ref(() => type)`

A reference to another `Type`

### Func `func(fields, type)`

An `Func` let you receive data from the outside world.

### Union `union(type, ...)`

A `Union` let you join multiple `Type` together (like an `OR`)

## Example

Create the schema:

```ts
const workspaceUserRoleType = enum(['admin', 'user'])

const meWorkspaceType = record({
  id: string(),
  name: string(),
  tenant: string(),
  role: workspaceUserRoleType
})

const meWorspacesType = list(meWorkspaceType)

const meType = record({
  id: string(),
  name: string(),
  email: string(),
  password: string(),
  workspaces: meWorspacesType,
})

const authRequestType = record({
  email: string(),
  otpId: string(),
})

const authLogin = func(loginInput, meType)
const authLogout = nil()
const authRequestOtp = func(requestOtpInput, authRequestType)

export const auth = record({
  login: authLogin,
  logout: authLogout,
  requestOtp: authRequestOtp
})

export const storageType = record({
  id: string(),
  description: string(),
})

export const workspaceType = record({
  id: string(),
  name: string(),
  tenant: string(),
  storages: func(pageInput, list(storageType)),
})

export const schema = type({
  auth,
  workspaces: func(pageInput, list(workspaceType)),
})
```

On the backend, declate implementations:

```ts
import { authLogin, meType } from './schema';

const authLoginImplem = implem(authLogin, async ({ input, fields, issues, ctx, respond }) => {
  // implement stuff

  // if input is invalid
  issues.add(fields.email, { kind: 'EmailUnknown' });
  return issues;

  // if something is wrong (will be catched)
  throw new Error('Something went wrong');

  // If you have value
  return respond(
    // next ctx
    ctx,
    // resolved types
    meType.resolve({ id: '', name: '', tenant: '' }),
    meWorspacesType.resolve([
      /*...*/
    ]),
  );
});

const resolver = createResolver(schema, [authLoginImplem]);
```

Finally, on the frontend, use your schema to build a query

```ts
schema.query((s) => s.auth.query((a) => a.login.query(formData, (me) => me)));

schema.query((s) =>
  s.me.query((me) => ({
    id: me.id,
    name: me.name,
    email: me.email,
  })),
);
```
