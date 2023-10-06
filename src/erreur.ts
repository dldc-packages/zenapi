import { Erreur, Key } from '@dldc/erreur';
// import type { TPath } from './entity';

export const ZenapiErreur = (() => {
  const ZenapiErreurKey = Key.createEmpty('ZenapiErreur');

  const UnresolvedValueKey = Key.createEmpty('UnresolvedValue');
  const InvalidResolvedValueKey = Key.createEmpty('InvalidResolvedValue');
  const InvalidQueryKey = Key.createEmpty('InvalidQuery');
  const UnexpectedNullableKey = Key.createEmpty('UnexpectedNullable');
  const UnexpectedReachKey = Key.createEmpty('UnexpectedReach');
  const DuplicateResolverKey = Key.create<{ abstractName: string }>('DuplicateResolver');
  const UnknownAbstractKey = Key.create<{ name: string }>('UnknownAbstract');
  const UnexpectedReadNextInEmptyQueryKey = Key.createEmpty('UnexpectedReadNextInEmptyQuery');
  const UnexpectedReadNextTypeKey = Key.createEmpty('UnexpectedReadNextType');

  return {
    Key: ZenapiErreurKey,
    create: createZenapiErreur,
    InvalidResolvedValue: {
      Key: InvalidResolvedValueKey,
      create: () => createZenapiErreur().with(InvalidResolvedValueKey.Provider()).withMessage('Invalid resolved value'),
    },
    UnresolvedValue: {
      Key: UnresolvedValueKey,
      create: () => createZenapiErreur().with(UnresolvedValueKey.Provider()).withMessage('Unresolved value'),
    },
    InvalidQuery: {
      Key: InvalidQueryKey,
      create: () => createZenapiErreur().with(InvalidQueryKey.Provider()).withMessage('Invalid query'),
    },
    UnexpectedNullable: {
      Key: UnexpectedNullableKey,
      create: () => createZenapiErreur().with(UnexpectedNullableKey.Provider()).withMessage('Unexpected nullable'),
    },
    UnexpectedReach: {
      Key: UnexpectedReachKey,
      create: () => createZenapiErreur().with(UnexpectedReachKey.Provider()).withMessage('Unexpected reach'),
    },
    DuplicateResolver: {
      Key: DuplicateResolverKey,
      create: (abstractName: string) =>
        createZenapiErreur()
          .with(DuplicateResolverKey.Provider({ abstractName }))
          .withMessage(`Duplicate resolver for ${abstractName}`),
    },
    UnknownAbstract: {
      Key: UnknownAbstractKey,
      create: (name: string) =>
        createZenapiErreur().with(UnknownAbstractKey.Provider({ name })).withMessage(`Unknown abstract "${name}"`),
    },
    UnexpectedReadNextInEmptyQuery: {
      Key: UnexpectedReadNextInEmptyQueryKey,
      create: () =>
        createZenapiErreur()
          .with(UnexpectedReadNextInEmptyQueryKey.Provider())
          .withMessage('Unexpected read next in empty query'),
    },
    UnexpectedReadNextType: {
      Key: UnexpectedReadNextTypeKey,
      create: () =>
        createZenapiErreur().with(UnexpectedReadNextTypeKey.Provider()).withMessage('Unexpected read next type'),
    },
  };

  // export const UnexpectedArrayInQueryDef = ErreurType.defineEmpty('UnexpectedArrayInQueryDef');

  // export const CouldNotResolve = ErreurType.defineWithTransform(
  //   'CouldNotResolve',
  //   (path: TPath) => ({ path }),
  //   (base, provider, { path }) => {
  //     return base.with(provider).withMessage(`Could not resolve ${path.join('.')}`);
  //   },
  // );

  function createZenapiErreur() {
    return Erreur.createWith(ZenapiErreurKey);
  }
})();
