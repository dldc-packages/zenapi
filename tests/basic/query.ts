import { query } from '../../src/mod';
import { schema } from './schema';

const q1 = query(schema, (s) => ({
  connexion: s.auth.login.formData(new FormData()).select(({ id, name, email }) => ({ id, name, email })),
}));

console.log(q1);

const q2 = query(schema, (s) =>
  s.workspaces.paginate(1, ({ id, name, storages }) => ({
    id,
    name,
    storages: storages.all(({ id, description }) => ({ id, description })),
  })),
);

console.log(q2);

const q3 = query(schema, (s) => ({
  first: s.workspace.json({ tenant: 'first', id: null }).select(({ id, name, tenant }) => ({ id, name, tenant })),
  second: s.workspace.json({ tenant: 'first', id: null }).select(({ id, name, tenant }) => ({ id, name, tenant })),
  third: s.workspace.json({ tenant: 'first', id: null }).select(({ id, name, tenant }) => ({ id, name, tenant })),
}));

console.log(q3);
