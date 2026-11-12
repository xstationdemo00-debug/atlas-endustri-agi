/** Compatibility response for the original Base44 React screens.
 *
 * Some legacy screens consume collection.items while others consume the
 * collection as an Array (length/map/filter/find). Keep both without leaking
 * pagination metadata or introducing enumerable circular JSON references.
 */
export function asLegacyCollection(value) {
  const rows = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  if (!Object.prototype.hasOwnProperty.call(rows, 'items')) {
    Object.defineProperty(rows, 'items', { value: rows, enumerable: false, configurable: true });
  }
  return rows;
}
