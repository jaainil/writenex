import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { beforeEach, test } from "vite-plus/test";
import JSZip from "jszip";
import { importWorkspace } from "./backup";
import {
  createDocument,
  db,
  getAllDocuments,
  saveWorkingDraft,
  deleteDocument,
} from "./db";

const date = "2026-10-16T10:00:00.000Z";
const document = {
  id: "restored",
  title: "Restored",
  content: "Writing",
  createdAt: date,
  updatedAt: date,
};

async function archive(entries: Record<string, unknown>) {
  const zip = new JSZip();
  for (const [name, value] of Object.entries(entries))
    zip.file(name, JSON.stringify(value));
  return (await zip.generateAsync({ type: "uint8array" })) as unknown as File;
}

beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
});

test("restore revives document and version dates", async () => {
  await importWorkspace(
    await archive({
      "documents.json": [document],
      "versions.json": [
        {
          id: 1,
          documentId: "restored",
          content: "Draft",
          timestamp: date,
          preview: "Draft",
        },
      ],
    })
  );
  assert.equal(
    (await getAllDocuments())[0]?.updatedAt.getTime(),
    Date.parse(date)
  );
  assert.equal(
    (await db.versions.get(1))?.timestamp.getTime(),
    Date.parse(date)
  );
});

test("invalid archives leave the complete existing workspace untouched", async () => {
  const existing = await createDocument("Keep me", "Original");
  await db.settings.put({ id: "theme", value: "dark" });
  await assert.rejects(
    importWorkspace(
      await archive({
        "documents.json": [document],
        "versions.json": [
          {
            id: 1,
            documentId: "restored",
            content: "Broken",
            timestamp: "bad date",
            preview: "Broken",
          },
        ],
      })
    )
  );
  assert.equal((await db.documents.get(existing.id))?.content, "Original");
  assert.equal(await db.documents.count(), 1);
  assert.equal((await db.settings.get("theme"))?.value, "dark");
});

test("successful restore removes stale recovery drafts", async () => {
  await saveWorkingDraft("restored", "Unrelated old content");
  await importWorkspace(await archive({ "documents.json": [document] }));
  assert.equal(await db.workingSaves.count(), 0);
});

test("unrecognized ZIP files are rejected", async () => {
  await assert.rejects(
    importWorkspace(await archive({ "unrelated.json": [] }))
  );
});

test("missing image payload rejects restore before any data is replaced", async () => {
  const existing = await createDocument("Keep me", "Original");
  await assert.rejects(
    importWorkspace(
      await archive({
        "documents.json": [document],
        "images_meta.json": [
          {
            id: 1,
            name: "photo.png",
            type: "image/png",
            createdAt: date,
            blobPath: "1-photo.png",
          },
        ],
      })
    )
  );
  assert.ok(await db.documents.get(existing.id));
});

test("duplicate IDs roll back the entire restore transaction", async () => {
  const existing = await createDocument("Keep me", "Original");
  await assert.rejects(
    importWorkspace(await archive({ "documents.json": [document, document] }))
  );
  assert.ok(await db.documents.get(existing.id));
});

test("deleting a document removes its recovery draft", async () => {
  const existing = await createDocument("Delete me", "Original");
  await saveWorkingDraft(existing.id, "Recovery");
  await deleteDocument(existing.id);
  assert.equal(await db.workingSaves.get(existing.id), undefined);
});
