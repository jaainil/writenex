/**
 * @fileoverview Barrel export for db module
 * @module lib/db
 */

export {
  clearAllVersions,
  createDocument,
  db,
  deleteDocument,
  deleteVersion,
  generateDocumentId,
  getAllDocuments,
  getDocument,
  getDocumentCount,
  getImage,
  getLastVersionTimestamp,
  getSetting,
  getVersion,
  getVersions,
  saveImage,
  saveSetting,
  saveVersion,
  updateDocument,
} from "./db";
export type {
  DocumentEntry,
  ImageEntry,
  SettingsEntry,
  VersionEntry,
} from "./types";
