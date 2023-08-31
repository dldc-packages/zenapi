import { ErreurType } from '@dldc/erreur';
import type { TPath } from './entity';

export const UnresolvedValue = ErreurType.defineEmpty('UnresolvedValue');

export const InvalidResolvedValue = ErreurType.defineEmpty('InvalidResolvedValue');

export const InvalidQuery = ErreurType.defineEmpty('InvalidQuery');

export const UnexpectedNullable = ErreurType.defineEmpty('UnexpectedNullable');

export const DuplicateResolver = ErreurType.defineWithTransform(
  'DuplicateResolver',
  (index: number) => ({ index }),
  (base, provider, { index }) => {
    return base.with(provider).withMessage(`Duplicate resolver for entity at index ${index}`);
  },
);

export const UnknownAbstract = ErreurType.defineWithTransform(
  'UnknownAbstract',
  (name: string) => ({ name }),
  (base, provider, { name }) => {
    return base.with(provider).withMessage(`Unknown abstract ${name}`);
  },
);

export const UnexpectedArrayInQueryDef = ErreurType.defineEmpty('UnexpectedArrayInQueryDef');

export const CouldNotResolve = ErreurType.defineWithTransform(
  'CouldNotResolve',
  (path: TPath) => ({ path }),
  (base, provider, { path }) => {
    return base.with(provider).withMessage(`Could not resolve ${path.join('.')}`);
  },
);

export const CannotResolveType = ErreurType.defineEmpty('CannotResolveType');

export const MissingTypeResolver = ErreurType.defineWithTransform(
  'MissingTypeResolver',
  (path: TPath) => ({ path }),
  (base, provider, { path }) => {
    return base.with(provider).withMessage(`Missing type resolver for ${path.join('.')}`);
  },
);

export const UnexpectedReadNextInEmptyQuery = ErreurType.defineEmpty('UnexpectedReadNextInEmptyQuery');

export const UnexpectedReadNextType = ErreurType.defineEmpty('UnexpectedReadNextType');
