// src/types/brands.ts
var ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
function isStoreId(value) {
  return value.length > 0 && ID_PATTERN.test(value);
}
function isDocumentId(value) {
  return value.length > 0 && ID_PATTERN.test(value);
}
function createStoreId(value) {
  if (!isStoreId(value)) {
    throw new Error(`Invalid store ID: ${value}`);
  }
  return value;
}
function createDocumentId(value) {
  if (!isDocumentId(value)) {
    throw new Error(`Invalid document ID: ${value}`);
  }
  return value;
}

export {
  isStoreId,
  isDocumentId,
  createStoreId,
  createDocumentId
};
//# sourceMappingURL=chunk-CLIMKLTW.js.map