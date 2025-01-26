# ZenAPI

> If [https://graphql.org/](GraphQL) and [https://github.com/trpc/trpc](tRPC)
> had a baby.

TL;DR; (too long; didn't **write**):

1. Create a special TypeScript file to define your Graph (similar to a GraphQL
   schema)
2. Write some resolvers to handle the incoming requests
3. In the client use the types from `1.` to get a type safe query builder

## Benefits

- Same advantages as GraphQL: fetch only what you need, query validation, etc.
- Type-safe client without any build step
- Very thin client library

## Example

Look at the `examples` folder for some examples of what is possible. You can
also look at the `test` folder to see what is supported.
