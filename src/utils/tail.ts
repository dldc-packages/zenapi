export function replaceTail<T>(
  array: T[],
  tail: T[],
): T[] {
  return array.slice(0, -1).concat(tail);
}

export function pushTail<T>(
  array: T[],
  tail: T,
): T[] {
  return array.slice().concat(tail);
}
