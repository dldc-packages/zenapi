import { assertType, type IsExact } from "@std/testing/types";
import { obj, query, type TQueryBase } from "../client.ts";

Deno.test("primitive", () => {
  const client = query<{ foo: string }>();
  const q = client.foo;
  assertType<IsExact<typeof q, TQueryBase<string>>>(true);
});

Deno.test("nullable value", () => {
  const client = query<{ foo: string | null }>();
  const q = client.foo;
  assertType<IsExact<typeof q, TQueryBase<string | null>>>(true);
});

Deno.test("optional primitive should return null or primitive union", () => {
  const client = query<{ foo?: string }>();
  const q = client.foo;
  assertType<IsExact<typeof q, TQueryBase<string | null>>>(true);
});

Deno.test("primitive in object", () => {
  const client = query<{ foo: { bar: string } }>();
  const q = client.foo.bar;
  assertType<IsExact<typeof q, TQueryBase<string>>>(true);
});

Deno.test("optional primitive in object", () => {
  const client = query<{ foo?: { bar: string } }>();
  const q = client.foo.bar;
  assertType<IsExact<typeof q, TQueryBase<string | null>>>(true);
});

Deno.test("children select in optional object", () => {
  const client = query<{ foo?: { bar: string } }>();
  const q = client.foo._((s) => obj({ bar: s.bar }));
  assertType<IsExact<typeof q, TQueryBase<{ bar: string } | null>>>(true);
});

Deno.test("children select in nullable object", () => {
  const client = query<{ foo: { bar: string } | null }>();
  const q = client.foo._((s) => obj({ bar: s.bar }));
  assertType<IsExact<typeof q, TQueryBase<{ bar: string } | null>>>(true);
});

Deno.test("children select in nullable optional object", () => {
  const client = query<{ foo?: { bar: string } | null }>();
  const q = client.foo._((s) => obj({ bar: s.bar }));
  assertType<IsExact<typeof q, TQueryBase<{ bar: string } | null>>>(true);
});
