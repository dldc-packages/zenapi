import { Erreur } from '@dldc/erreur';
import { expect, test } from 'vitest';
import { engine, entity, obj, query, resolver } from '../src/mod';

const item = entity.object({
  id: entity.string(),
  name: entity.string(),
});

const items = entity.list(item);

const itemsResolver = resolver(items.entity, [], () => {
  return [{ id: '1' }, { id: '1' }];
});

const itemResolver = resolver(item.entity, [], (ctx) => {
  const { id } = ctx.value as { id: string };
  return {
    id,
    name: `Item ${id}`,
  };
});

const appEngine = engine({
  schema: items,
  resolvers: [itemsResolver, itemResolver],
  onError: (error) => {
    return error instanceof Erreur ? error.toJSON() : 'Unknown error';
  },
});

test('should resolve partial result in list', async () => {
  const q = query(items).all((item) => item(({ id, name }) => obj({ id, name })));
  const res = await appEngine.run(q);

  expect(res).toEqual([
    { id: '1', name: 'Item 1' },
    { id: '1', name: 'Item 1' },
  ]);
});
