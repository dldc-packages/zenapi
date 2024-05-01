import { createErreurStore } from '@dldc/erreur';
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

export const ZenapiErreurInternal = createErreurStore<TZenapiErreurData>();

export const ZenapiErreur = ZenapiErreurInternal.asReadonly;

export function createInvalidResolvedValue(path: TPath, message: string) {
  return ZenapiErreurInternal.setAndReturn(new Error(`Invalid resolved value at "${path.join('.')}": ${message}`), {
    kind: 'InvalidResolvedValue',
    path,
  });
}

export function createUnresolvedValue(path: TPath) {
  return ZenapiErreurInternal.setAndReturn(new Error(`Unresolved value at ${path.join('.')}`), {
    kind: 'UnresolvedValue',
    path,
  });
}

export function createInvalidQuery() {
  return ZenapiErreurInternal.setAndReturn(new Error('Invalid query'), { kind: 'InvalidQuery' });
}

export function createUnexpectedNullable() {
  return ZenapiErreurInternal.setAndReturn(new Error('Unexpected nullable'), { kind: 'UnexpectedNullable' });
}

export function createUnexpectedReach() {
  return ZenapiErreurInternal.setAndReturn(new Error('Unexpected reach'), { kind: 'UnexpectedReach' });
}

export function createDuplicateResolver(abstractName: string) {
  return ZenapiErreurInternal.setAndReturn(new Error(`Duplicate resolver for ${abstractName}`), {
    kind: 'DuplicateResolver',
    abstractName,
  });
}

export function createUnknownAbstract(name: string) {
  return ZenapiErreurInternal.setAndReturn(new Error(`Unknown abstract "${name}"`), { kind: 'UnknownAbstract', name });
}

export function createUnexpectedReadNextInEmptyQuery() {
  return ZenapiErreurInternal.setAndReturn(new Error('Unexpected read next in empty query'), {
    kind: 'UnexpectedReadNextInEmptyQuery',
  });
}

export function createUnexpectedReadNextType() {
  return ZenapiErreurInternal.setAndReturn(new Error('Unexpected read next type'), { kind: 'UnexpectedReadNextType' });
}
