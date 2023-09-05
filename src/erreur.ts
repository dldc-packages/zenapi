import { ErreurType } from '@dldc/erreur';
// import type { TPath } from './entity';

export const UnresolvedValue = ErreurType.defineEmpty('UnresolvedValue', (base, provider) => {
  return base.with(provider).withMessage('Unresolved value');
});

export const InvalidResolvedValue = ErreurType.defineEmpty('InvalidResolvedValue');

export const InvalidQuery = ErreurType.defineEmpty('InvalidQuery');

export const UnexpectedNullable = ErreurType.defineEmpty('UnexpectedNullable');

export const UnexpectedReach = ErreurType.defineEmpty('UnexpectedReach');

export const DuplicateResolver = ErreurType.defineWithTransform(
  'DuplicateResolver',
  (abstractName: string) => ({ abstractName }),
  (base, provider, { abstractName }) => {
    return base.with(provider).withMessage(`Duplicate resolver for ${abstractName}`);
  },
);

export const UnknownAbstract = ErreurType.defineWithTransform(
  'UnknownAbstract',
  (name: string) => ({ name }),
  (base, provider, { name }) => {
    return base.with(provider).withMessage(`Unknown abstract ${name}`);
  },
);

export const UnexpectedReadNextInEmptyQuery = ErreurType.defineEmpty('UnexpectedReadNextInEmptyQuery');

export const UnexpectedReadNextType = ErreurType.defineEmpty('UnexpectedReadNextType');

// export const UnexpectedArrayInQueryDef = ErreurType.defineEmpty('UnexpectedArrayInQueryDef');

// export const CouldNotResolve = ErreurType.defineWithTransform(
//   'CouldNotResolve',
//   (path: TPath) => ({ path }),
//   (base, provider, { path }) => {
//     return base.with(provider).withMessage(`Could not resolve ${path.join('.')}`);
//   },
// );
