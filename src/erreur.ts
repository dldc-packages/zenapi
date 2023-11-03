import type { TKey } from '@dldc/erreur';
import { Erreur, Key } from '@dldc/erreur';
import type { TPath } from './entity';

export type TZenapiErreurData =
  | { kind: 'UnresolvedValue'; path: TPath }
  | { kind: 'InvalidResolvedValue'; path: TPath }
  | { kind: 'InvalidQuery' }
  | { kind: 'UnexpectedNullable' }
  | { kind: 'UnexpectedReach' }
  | { kind: 'DuplicateResolver'; abstractName: string }
  | { kind: 'UnknownAbstract'; name: string }
  | { kind: 'UnexpectedReadNextInEmptyQuery' }
  | { kind: 'UnexpectedReadNextType' };

export const ZenapiErreurKey: TKey<TZenapiErreurData, false> = Key.create<TZenapiErreurData>('ZenapiErreur');

export const ZenapiErreur = {
  InvalidResolvedValue: (path: TPath, message: string) => {
    return Erreur.create(new Error(`Invalid resolved value at "${path.join('.')}": ${message}`))
      .with(ZenapiErreurKey.Provider({ kind: 'InvalidResolvedValue', path }))
      .withName('ZenapiErreur');
  },
  UnresolvedValue: (path: TPath) => {
    return Erreur.create(new Error(`Unresolved value at ${path.join('.')}`))
      .with(ZenapiErreurKey.Provider({ kind: 'UnresolvedValue', path }))
      .withName('ZenapiErreur');
  },
  InvalidQuery: () => {
    return Erreur.create(new Error('Invalid query'))
      .with(ZenapiErreurKey.Provider({ kind: 'InvalidQuery' }))
      .withName('ZenapiErreur');
  },
  UnexpectedNullable: () => {
    return Erreur.create(new Error('Unexpected nullable'))
      .with(ZenapiErreurKey.Provider({ kind: 'UnexpectedNullable' }))
      .withName('ZenapiErreur');
  },
  UnexpectedReach: () => {
    return Erreur.create(new Error('Unexpected reach'))
      .with(ZenapiErreurKey.Provider({ kind: 'UnexpectedReach' }))
      .withName('ZenapiErreur');
  },
  DuplicateResolver: (abstractName: string) => {
    return Erreur.create(new Error(`Duplicate resolver for ${abstractName}`))
      .with(ZenapiErreurKey.Provider({ kind: 'DuplicateResolver', abstractName }))
      .withName('ZenapiErreur');
  },
  UnknownAbstract: (name: string) => {
    return Erreur.create(new Error(`Unknown abstract "${name}"`))
      .with(ZenapiErreurKey.Provider({ kind: 'UnknownAbstract', name }))
      .withName('ZenapiErreur');
  },
  UnexpectedReadNextInEmptyQuery: () => {
    return Erreur.create(new Error('Unexpected read next in empty query'))
      .with(ZenapiErreurKey.Provider({ kind: 'UnexpectedReadNextInEmptyQuery' }))
      .withName('ZenapiErreur');
  },
  UnexpectedReadNextType: () => {
    return Erreur.create(new Error('Unexpected read next type'))
      .with(ZenapiErreurKey.Provider({ kind: 'UnexpectedReadNextType' }))
      .withName('ZenapiErreur');
  },
};
