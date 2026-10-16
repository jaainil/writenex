import JSZip from "jszip";
import {
  db,
  type DocumentEntry,
  type ImageEntry,
  type SettingsEntry,
  type VersionEntry,
} from "./db";

export async function exportWorkspace(): Promise<void> {
  const zip = new JSZip();
  const snapshot = await db.transaction("r", db.tables, async () => {
    const documents = await db.documents.toArray();
    const drafts = await db.workingSaves.toArray();
    // A backup must include writing still inside the auto-save debounce window.
    for (const doc of documents) {
      const draft = drafts.find((entry) => entry.id === doc.id);
      if (draft && draft.timestamp > doc.updatedAt) {
        doc.content = draft.content;
        doc.updatedAt = draft.timestamp;
      }
    }
    return {
      documents,
      versions: await db.versions.toArray(),
      settings: await db.settings.toArray(),
      images: await db.images.toArray(),
    };
  });
  zip.file("documents.json", JSON.stringify(snapshot.documents, null, 2));
  zip.file("versions.json", JSON.stringify(snapshot.versions, null, 2));
  zip.file("settings.json", JSON.stringify(snapshot.settings, null, 2));
  const imageData = await Promise.all(
    snapshot.images.map(async (img) => {
      // Use the ID for the archive path; user-provided names can contain slashes.
      const blobPath = `${img.id}`;
      zip.file(`images/${blobPath}`, await img.blob.arrayBuffer());
      return {
        id: img.id,
        name: img.name,
        type: img.type,
        createdAt: img.createdAt,
        blobPath,
      };
    })
  );
  zip.file("images_meta.json", JSON.stringify(imageData, null, 2));
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `writenex-backup-${new Date().toISOString().split("T")[0]}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  await db.settings.put({
    id: "lastExportDate",
    value: new Date().toISOString(),
  });
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid backup entry.");
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid text in backup.");
  return value;
}

function date(value: unknown): Date {
  const parsed = new Date(text(value));
  if (!Number.isFinite(parsed.getTime()))
    throw new Error("Invalid date in backup.");
  return parsed;
}

function numericId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1)
    throw new Error("Invalid ID in backup.");
  return value;
}

async function entries(zip: JSZip, name: string): Promise<unknown[]> {
  const file = zip.file(name);
  if (!file) return [];
  const parsed: unknown = JSON.parse(await file.async("string"));
  if (!Array.isArray(parsed)) throw new Error(`Invalid ${name} in backup.`);
  return parsed;
}

export async function importWorkspace(file: File): Promise<void> {
  const zip = await JSZip.loadAsync(file);
  if (!zip.file("documents.json"))
    throw new Error("This ZIP is not a Writenex workspace backup.");

  // Decode and validate every table and binary before touching the workspace.
  const documents: DocumentEntry[] = (await entries(zip, "documents.json")).map(
    (value) => {
      const entry = record(value);
      return {
        id: text(entry.id),
        title: text(entry.title),
        content: text(entry.content),
        createdAt: date(entry.createdAt),
        updatedAt: date(entry.updatedAt),
      };
    }
  );
  const documentIds = new Set(documents.map((doc) => doc.id));
  const versions: VersionEntry[] = (await entries(zip, "versions.json")).map(
    (value) => {
      const entry = record(value);
      const documentId = text(entry.documentId);
      if (!documentIds.has(documentId))
        throw new Error("Backup version refers to a missing document.");
      return {
        id: numericId(entry.id),
        documentId,
        content: text(entry.content),
        timestamp: date(entry.timestamp),
        preview: text(entry.preview),
        ...(entry.label === undefined ? {} : { label: text(entry.label) }),
      };
    }
  );
  const settings: SettingsEntry[] = (await entries(zip, "settings.json")).map(
    (value) => {
      const entry = record(value);
      return { id: text(entry.id), value: text(entry.value) };
    }
  );
  const images: ImageEntry[] = await Promise.all(
    (await entries(zip, "images_meta.json")).map(async (value) => {
      const entry = record(value);
      const payload = zip.file(`images/${text(entry.blobPath)}`);
      if (!payload) throw new Error("Backup is missing an image file.");
      const type = text(entry.type);
      return {
        id: numericId(entry.id),
        name: text(entry.name),
        type,
        createdAt: date(entry.createdAt),
        blob: new Blob([await payload.async("arraybuffer")], { type }),
      };
    })
  );

  // A failed insertion rolls back all clears, including duplicate-key failures.
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
    await db.documents.bulkAdd(documents);
    await db.versions.bulkAdd(versions);
    await db.settings.bulkAdd(settings);
    await db.images.bulkAdd(images);
  });
}
