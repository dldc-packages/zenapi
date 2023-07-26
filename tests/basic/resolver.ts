import { createResolver, implem, respond } from '../../src/mod';
import { authLogin, meType, meUserPasswordType, meWorspacesType, schema } from './schema';

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
    meType.resolve({ id: '', name: '' }),
    meUserPasswordType.resolve('****'),
    meWorspacesType.resolve([]),
  );
});

export const resolver = createResolver(schema, authLoginImplem);
