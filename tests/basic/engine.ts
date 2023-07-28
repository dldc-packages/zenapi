import { engine, implem, resolve, respond } from '../../src/mod';
import { authLogin, meType, meUserPasswordType, meWorspacesType, schema, version } from './schema';

const authLoginImplem = implem(authLogin, ({ ctx, input }) => {
  // implement stuff
  console.log(input.email);
  // if input is invalid
  // issues.add(fields.email, { kind: 'EmailUnknown' });
  // return issues;

  // if something is wrong (will be catched)
  // throw new Error('Something went wrong');

  // If you have value
  return respond(
    // next ctx
    ctx,
    // resolved types
    resolve(meType, { id: '', name: '' }),
    resolve(meUserPasswordType, '****'),
  );
});

const versionImplem = implem(version, ({ ctx }) => {
  return respond(ctx, resolve(version, '1.0.0'));
});

const meWorspacesTypeImplem = implem(meWorspacesType, ({ ctx }) => {
  return respond(ctx, resolve(meWorspacesType, []));
});

export const apiEngine = engine(schema, authLoginImplem, meWorspacesTypeImplem, versionImplem);
