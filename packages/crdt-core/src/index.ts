/**
 * index.ts
 * -----------------------------------------------------------------------
 * Barrel export — titik masuk tunggal untuk import module crdt/
 */
export { RGADocument } from "./rga-document";
export type { RGANode } from "./rga-node";
export type { Identifier } from "./identifier";
export { compareIdentifier, identifiersEqual } from "./identifier";
export type { Operation, InsertOperation, DeleteOperation } from "./operation";
export { serializeOperation, deserializeOperation, operationSchema } from "./operation";