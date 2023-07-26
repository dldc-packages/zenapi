import { queryBuilder } from '../../src/mod';
import { schema } from './schema';

const query = queryBuilder(schema);

const q1 = query((s) =>
  s.auth(({ login }) => ({
    connexion: login.formData(new FormData())(({ id, name, email }) => ({ id, name, email })),
  })),
);

const q2 = query((s) =>
  s.workspaces.formData(new FormData())(({ id, name, storages }) => ({
    id,
    storages: storages.formData(new FormData())((s) => s),
  })),
);
