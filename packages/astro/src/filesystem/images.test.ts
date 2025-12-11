/**
 * @fileoverview Property-based tests for image discovery
 *
 * Tests the image discovery functionality using fast-check for
 * property-based testing to ensure correctness properties hold.
 *
 * @module @writenex/astro/filesystem/images.test
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import type { DiscoveredImage } from "../types";
import {
  getContentImageFolder,
  detectContentStructure,
  scanDirectoryForImages,
  calculateRelativePath,
  type ContentStructure,
} from "./images";

/**
 * Arbitrary generator for valid image extensions
 */
const imageExtensionArb = fc.constantFrom(
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg"
);

/**
 * Arbitrary generator for valid filenames (without extension)
 */
const baseFilenameArb = fc
  .string({
    minLength: 1,
    maxLength: 50,
    unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
  })
  .filter((s) => s.length > 0);

/**
 * Arbitrary generator for directory names
 */
const dirNameArb = fc.string({
  minLength: 1,
  maxLength: 20,
  unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
});

/**
 * Arbitrary generator for file sizes (positive integers)
 */
const fileSizeArb = fc.integer({ min: 1, max: 100_000_000 });

/**
 * Arbitrary generator for DiscoveredImage objects
 * Ensures consistency between filename and extension fields
 */
const discoveredImageArb: fc.Arbitrary<DiscoveredImage> = fc
  .tuple(
    baseFilenameArb,
    imageExtensionArb,
    fc.array(dirNameArb, { minLength: 0, maxLength: 3 }),
    fc.array(dirNameArb, { minLength: 1, maxLength: 5 }),
    fileSizeArb
  )
  .map(([baseName, extension, relDirs, absDirs, size]) => {
    const filename = `${baseName}${extension}`;
    const relativePath =
      relDirs.length === 0
        ? `./${filename}`
        : `./${relDirs.join("/")}/${filename}`;
    const absolutePath = `/${absDirs.join("/")}/${filename}`;
    return {
      filename,
      relativePath,
      absolutePath,
      size,
      extension,
    };
  });

describe("DiscoveredImage Structure", () => {
  /**
   * **Feature: recursive-image-discovery, Property 5: API response contains all required fields**
   * **Validates: Requirements 3.1, 3.2**
   *
   * For any DiscoveredImage object, it SHALL contain all required fields:
   * filename, relativePath, absolutePath, size, and extension.
   */
  it("Property 5: API response contains all required fields", () => {
    fc.assert(
      fc.property(discoveredImageArb, (image: DiscoveredImage) => {
        // Verify all required fields are present and have correct types
        expect(image).toHaveProperty("filename");
        expect(image).toHaveProperty("relativePath");
        expect(image).toHaveProperty("absolutePath");
        expect(image).toHaveProperty("size");
        expect(image).toHaveProperty("extension");

        // Verify field types
        expect(typeof image.filename).toBe("string");
        expect(typeof image.relativePath).toBe("string");
        expect(typeof image.absolutePath).toBe("string");
        expect(typeof image.size).toBe("number");
        expect(typeof image.extension).toBe("string");

        // Verify field constraints
        expect(image.filename.length).toBeGreaterThan(0);
        expect(image.relativePath).toMatch(/^\.\//);
        expect(image.absolutePath).toMatch(/^\//);
        expect(image.size).toBeGreaterThan(0);
        expect(image.extension).toMatch(/^\.[a-z]+$/);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: filename contains valid extension
   */
  it("filename contains a valid image extension", () => {
    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".avif",
      ".svg",
    ];

    fc.assert(
      fc.property(discoveredImageArb, (image: DiscoveredImage) => {
        const hasValidExtension = validExtensions.some((ext) =>
          image.filename.toLowerCase().endsWith(ext)
        );
        expect(hasValidExtension).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: extension field matches filename extension
   */
  it("extension field matches the filename extension", () => {
    fc.assert(
      fc.property(discoveredImageArb, (image: DiscoveredImage) => {
        const filenameExt = image.filename
          .slice(image.filename.lastIndexOf("."))
          .toLowerCase();
        expect(image.extension.toLowerCase()).toBe(filenameExt);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Content Structure Detection Tests
// =============================================================================

/**
 * Arbitrary generator for valid content slugs
 */
const contentSlugArb = fc
  .string({
    minLength: 1,
    maxLength: 30,
    unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")),
  })
  .filter((s) => s.length > 0 && !s.startsWith("-") && !s.endsWith("-"));

/**
 * Arbitrary generator for date prefixes (YYYY-MM-DD format)
 */
const datePrefixArb = fc
  .tuple(
    fc.integer({ min: 2000, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([year, month, day]) => {
    const m = month.toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${year}-${m}-${d}`;
  });

/**
 * Arbitrary generator for content structure types
 */
const contentStructureArb: fc.Arbitrary<ContentStructure> = fc.constantFrom(
  "flat",
  "folder-based",
  "date-prefixed"
);

describe("Content Structure Detection", () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    testDir = join(
      tmpdir(),
      `writenex-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * **Feature: recursive-image-discovery, Property 3: Content structure detection is correct**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   *
   * For any content item, the system SHALL correctly identify its structure
   * (flat, folder-based, or date-prefixed) and scan the appropriate image folder.
   */
  it("Property 3: Content structure detection is correct", () => {
    fc.assert(
      fc.property(
        contentSlugArb,
        contentStructureArb,
        fc.boolean(),
        (slug, structure, hasImageFolder) => {
          // Use unique collection path per iteration to avoid interference
          const iterationId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const collectionPath = join(testDir, `collection-${iterationId}`);
          mkdirSync(collectionPath, { recursive: true });

          let contentFilePath: string;
          let expectedImageFolder: string | null;

          switch (structure) {
            case "flat": {
              // Flat file: my-post.md with optional my-post/ folder
              contentFilePath = join(collectionPath, `${slug}.md`);
              writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

              if (hasImageFolder) {
                const imageFolder = join(collectionPath, slug);
                mkdirSync(imageFolder, { recursive: true });
                expectedImageFolder = imageFolder;
              } else {
                expectedImageFolder = null;
              }
              break;
            }

            case "folder-based": {
              // Folder-based: slug/index.md - folder always exists
              const contentFolder = join(collectionPath, slug);
              mkdirSync(contentFolder, { recursive: true });
              contentFilePath = join(contentFolder, "index.md");
              writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");
              // For folder-based, the image folder is always the content folder itself
              expectedImageFolder = contentFolder;
              break;
            }

            case "date-prefixed": {
              // Date-prefixed: 2024-01-15-my-post.md with optional folder
              const datePrefix = "2024-01-15";
              const fullSlug = `${datePrefix}-${slug}`;
              contentFilePath = join(collectionPath, `${fullSlug}.md`);
              writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

              if (hasImageFolder) {
                const imageFolder = join(collectionPath, fullSlug);
                mkdirSync(imageFolder, { recursive: true });
                expectedImageFolder = imageFolder;
              } else {
                expectedImageFolder = null;
              }
              break;
            }
          }

          // Test detectContentStructure
          const detectedStructure = detectContentStructure(contentFilePath);
          expect(detectedStructure).toBe(structure);

          // Test getContentImageFolder
          const contentId =
            structure === "date-prefixed" ? `2024-01-15-${slug}` : slug;
          const imageFolder = getContentImageFolder(
            collectionPath,
            contentId,
            contentFilePath
          );
          expect(imageFolder).toBe(expectedImageFolder);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: detectContentStructure correctly identifies index files
   */
  it("detectContentStructure identifies folder-based structure for index files", () => {
    fc.assert(
      fc.property(
        contentSlugArb,
        fc.constantFrom("index.md", "index.mdx"),
        (slug, indexFile) => {
          const contentFilePath = join(testDir, slug, indexFile);
          const structure = detectContentStructure(contentFilePath);
          expect(structure).toBe("folder-based");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: detectContentStructure correctly identifies date-prefixed files
   */
  it("detectContentStructure identifies date-prefixed structure", () => {
    fc.assert(
      fc.property(datePrefixArb, contentSlugArb, (datePrefix, slug) => {
        const contentFilePath = join(testDir, `${datePrefix}-${slug}.md`);
        const structure = detectContentStructure(contentFilePath);
        expect(structure).toBe("date-prefixed");
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: detectContentStructure identifies flat files without date prefix
   */
  it("detectContentStructure identifies flat structure for regular files", () => {
    fc.assert(
      fc.property(
        contentSlugArb.filter((s) => !/^\d{4}-\d{2}-\d{2}-/.test(s)),
        (slug) => {
          const contentFilePath = join(testDir, `${slug}.md`);
          const structure = detectContentStructure(contentFilePath);
          expect(structure).toBe("flat");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: getContentImageFolder returns null when folder doesn't exist
   */
  it("getContentImageFolder returns null when image folder does not exist", () => {
    fc.assert(
      fc.property(contentSlugArb, (slug) => {
        const collectionPath = join(testDir, "collection");
        mkdirSync(collectionPath, { recursive: true });

        // Create flat file without sibling folder
        const contentFilePath = join(collectionPath, `${slug}.md`);
        writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

        const imageFolder = getContentImageFolder(
          collectionPath,
          slug,
          contentFilePath
        );
        expect(imageFolder).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: getContentImageFolder returns parent folder for folder-based content
   */
  it("getContentImageFolder returns parent folder for folder-based content", () => {
    fc.assert(
      fc.property(contentSlugArb, (slug) => {
        const collectionPath = join(testDir, "collection");
        const contentFolder = join(collectionPath, slug);
        mkdirSync(contentFolder, { recursive: true });

        const contentFilePath = join(contentFolder, "index.md");
        writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

        const imageFolder = getContentImageFolder(
          collectionPath,
          slug,
          contentFilePath
        );
        expect(imageFolder).toBe(contentFolder);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Recursive Directory Scanner Tests
// =============================================================================

/**
 * Arbitrary generator for image filenames with valid extensions
 */
const imageFilenameArb = fc
  .tuple(baseFilenameArb, imageExtensionArb)
  .map(([name, ext]) => `${name}${ext}`);

/**
 * Arbitrary generator for non-image filenames
 */
const nonImageFilenameArb = fc
  .tuple(
    baseFilenameArb,
    fc.constantFrom(".txt", ".md", ".json", ".html", ".css", ".js")
  )
  .map(([name, ext]) => `${name}${ext}`);

/**
 * Helper to create a file with random content
 */
function createTestFile(filePath: string, size: number = 100): void {
  const content = Buffer.alloc(size, "x");
  writeFileSync(filePath, content);
}

describe("Recursive Directory Scanner", () => {
  // Each test creates its own unique directory to avoid conflicts

  /**
   * **Feature: recursive-image-discovery, Property 1: All images in folder are discovered**
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any content folder containing image files, scanning that folder SHALL return
   * all image files with valid extensions (.jpg, .jpeg, .png, .gif, .webp, .avif, .svg).
   */
  it("Property 1: All images in folder are discovered", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(imageFilenameArb, { minLength: 1, maxLength: 10 }),
        fc.array(nonImageFilenameArb, { minLength: 0, maxLength: 5 }),
        async (imageFiles, nonImageFiles) => {
          // Create unique test directory for this property run
          const testDir = join(
            tmpdir(),
            `writenex-p1-${Date.now()}-${Math.random().toString(36).slice(2)}`
          );
          mkdirSync(testDir, { recursive: true });

          try {
            // Deduplicate filenames to avoid overwriting
            const uniqueImageFiles = [...new Set(imageFiles)];
            const uniqueNonImageFiles = [...new Set(nonImageFiles)];

            // Create image files
            for (const filename of uniqueImageFiles) {
              createTestFile(join(testDir, filename));
            }

            // Create non-image files
            for (const filename of uniqueNonImageFiles) {
              createTestFile(join(testDir, filename));
            }

            // Scan directory
            const result = await scanDirectoryForImages(testDir, testDir, {
              maxDepth: 5,
              currentDepth: 0,
              basePath: testDir,
            });

            // Verify all image files are discovered
            const discoveredFilenames = result.map((img) => img.filename);
            for (const imageFile of uniqueImageFiles) {
              expect(discoveredFilenames).toContain(imageFile);
            }

            // Verify no non-image files are included
            for (const nonImageFile of uniqueNonImageFiles) {
              expect(discoveredFilenames).not.toContain(nonImageFile);
            }

            // Verify count matches unique image files
            expect(result.length).toBe(uniqueImageFiles.length);
          } finally {
            rmSync(testDir, { recursive: true, force: true });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: recursive-image-discovery, Property 2: Nested subfolder images are included**
   * **Validates: Requirements 1.3, 4.3**
   *
   * For any content folder with nested subfolders containing images, scanning SHALL
   * include images from all subfolders up to the maximum depth, with correct relative
   * paths preserving subfolder structure.
   */
  it("Property 2: Nested subfolder images are included", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dirNameArb, { minLength: 1, maxLength: 3 }),
        imageFilenameArb,
        async (subfolders, imageFilename) => {
          // Create unique nested directory structure for this property run
          const testDir = join(
            tmpdir(),
            `writenex-p2-${Date.now()}-${Math.random().toString(36).slice(2)}`
          );
          mkdirSync(testDir, { recursive: true });

          try {
            // Create nested subfolder path
            let currentPath = testDir;
            for (const folder of subfolders) {
              currentPath = join(currentPath, folder);
              mkdirSync(currentPath, { recursive: true });
            }

            // Create image in deepest folder
            const imagePath = join(currentPath, imageFilename);
            createTestFile(imagePath);

            // Scan directory
            const result = await scanDirectoryForImages(testDir, testDir, {
              maxDepth: 5,
              currentDepth: 0,
              basePath: testDir,
            });

            // Verify image is discovered
            expect(result.length).toBe(1);
            expect(result[0]?.filename).toBe(imageFilename);

            // Verify relative path preserves subfolder structure
            const expectedRelPath = `./${subfolders.join("/")}/${imageFilename}`;
            expect(result[0]?.relativePath).toBe(expectedRelPath);
          } finally {
            rmSync(testDir, { recursive: true, force: true });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: recursive-image-discovery, Property 6: Recursion depth is limited**
   * **Validates: Requirements 5.1**
   *
   * For any folder structure deeper than maxDepth levels, scanning SHALL stop at
   * maxDepth and not descend further.
   */
  it("Property 6: Recursion depth is limited", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }),
        imageFilenameArb,
        async (maxDepth, imageFilename) => {
          // Create unique directory structure for this property run
          const testDir = join(
            tmpdir(),
            `writenex-p6-${Date.now()}-${Math.random().toString(36).slice(2)}`
          );
          mkdirSync(testDir, { recursive: true });

          try {
            // Create folders at each depth level with an image
            // The root folder is depth 0, first subfolder is depth 1, etc.
            let currentPath = testDir;

            // Create image at root (depth 0) - this is always scanned
            createTestFile(join(testDir, `root-${imageFilename}`));

            // Create nested folders with images (depth 1, 2, 3, ...)
            // We create maxDepth + 2 levels to ensure we have images beyond maxDepth
            for (let depth = 1; depth <= maxDepth + 2; depth++) {
              const folderName = `level${depth}`;
              currentPath = join(currentPath, folderName);
              mkdirSync(currentPath, { recursive: true });

              // Create image at this depth
              createTestFile(join(currentPath, `img${depth}-${imageFilename}`));
            }

            // Scan with limited depth
            const result = await scanDirectoryForImages(testDir, testDir, {
              maxDepth,
              currentDepth: 0,
              basePath: testDir,
            });

            // Verify only images within maxDepth are discovered
            // maxDepth=2 means we scan depth 0 (root) and depth 1 (level1), finding 2 images
            // maxDepth=3 means we scan depth 0, 1, 2, finding 3 images
            // maxDepth=4 means we scan depth 0, 1, 2, 3, finding 4 images
            expect(result.length).toBe(maxDepth);
          } finally {
            rmSync(testDir, { recursive: true, force: true });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: recursive-image-discovery, Property 7: Hidden and special folders are skipped**
   * **Validates: Requirements 5.2**
   *
   * For any folder structure containing hidden folders (starting with .) or special
   * folders (starting with _), scanning SHALL skip these folders entirely.
   */
  it("Property 7: Hidden and special folders are skipped", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(".hidden", "_special", ".git", "_drafts", ".__cache"),
        imageFilenameArb,
        async (skipFolder, imageFilename) => {
          // Create unique directory for this property run
          const testDir = join(
            tmpdir(),
            `writenex-p7-${Date.now()}-${Math.random().toString(36).slice(2)}`
          );
          mkdirSync(testDir, { recursive: true });

          try {
            // Use different filenames for hidden and visible images
            const hiddenImage = `hidden-${imageFilename}`;
            const visibleImage = `visible-${imageFilename}`;

            // Create hidden/special folder with image
            const hiddenDir = join(testDir, skipFolder);
            mkdirSync(hiddenDir, { recursive: true });
            createTestFile(join(hiddenDir, hiddenImage));

            // Create visible folder with image
            const visibleDir = join(testDir, "visible");
            mkdirSync(visibleDir, { recursive: true });
            createTestFile(join(visibleDir, visibleImage));

            // Scan directory
            const result = await scanDirectoryForImages(testDir, testDir, {
              maxDepth: 5,
              currentDepth: 0,
              basePath: testDir,
            });

            // Verify only visible image is discovered
            expect(result.length).toBe(1);
            expect(result[0]?.filename).toBe(visibleImage);

            // Verify hidden image is not included
            const discoveredFilenames = result.map((img) => img.filename);
            expect(discoveredFilenames).not.toContain(hiddenImage);
          } finally {
            rmSync(testDir, { recursive: true, force: true });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Empty directory returns empty array
   */
  it("Empty directory returns empty array", async () => {
    const testDir = join(
      tmpdir(),
      `writenex-empty-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });

    try {
      const result = await scanDirectoryForImages(testDir, testDir, {
        maxDepth: 5,
        currentDepth: 0,
        basePath: testDir,
      });

      expect(result).toEqual([]);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Additional property: Non-existent directory returns empty array
   */
  it("Non-existent directory returns empty array", async () => {
    const testDir = join(
      tmpdir(),
      `writenex-nonexistent-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    const result = await scanDirectoryForImages(testDir, testDir, {
      maxDepth: 5,
      currentDepth: 0,
      basePath: testDir,
    });

    expect(result).toEqual([]);
  });
});

// =============================================================================
// Relative Path Calculation Tests
// =============================================================================

describe("Relative Path Calculation", () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    testDir = join(
      tmpdir(),
      `writenex-relpath-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * **Feature: recursive-image-discovery, Property 4: Relative path calculation is correct**
   * **Validates: Requirements 4.1, 4.2**
   *
   * For any discovered image, the relative path SHALL be correctly calculated from
   * the content file location, such that the path can be used directly in markdown
   * image syntax.
   */
  it("Property 4: Relative path calculation is correct", () => {
    fc.assert(
      fc.property(
        contentSlugArb,
        contentStructureArb,
        fc.array(dirNameArb, { minLength: 0, maxLength: 3 }),
        imageFilenameArb,
        (slug, structure, subfolders, imageFilename) => {
          const collectionPath = join(testDir, "collection");
          mkdirSync(collectionPath, { recursive: true });

          let contentFilePath: string;
          let imageFolderPath: string;

          switch (structure) {
            case "flat": {
              // Flat file: my-post.md with my-post/ folder
              contentFilePath = join(collectionPath, `${slug}.md`);
              imageFolderPath = join(collectionPath, slug);
              break;
            }

            case "folder-based": {
              // Folder-based: slug/index.md
              const contentFolder = join(collectionPath, slug);
              mkdirSync(contentFolder, { recursive: true });
              contentFilePath = join(contentFolder, "index.md");
              imageFolderPath = contentFolder;
              break;
            }

            case "date-prefixed": {
              // Date-prefixed: 2024-01-15-my-post.md with folder
              const datePrefix = "2024-01-15";
              const fullSlug = `${datePrefix}-${slug}`;
              contentFilePath = join(collectionPath, `${fullSlug}.md`);
              imageFolderPath = join(collectionPath, fullSlug);
              break;
            }
          }

          // Create content file
          mkdirSync(dirname(contentFilePath), { recursive: true });
          writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

          // Create image folder with optional subfolders
          let imageDir = imageFolderPath;
          mkdirSync(imageDir, { recursive: true });

          for (const subfolder of subfolders) {
            imageDir = join(imageDir, subfolder);
            mkdirSync(imageDir, { recursive: true });
          }

          // Create image file
          const imagePath = join(imageDir, imageFilename);
          createTestFile(imagePath);

          // Calculate relative path
          const relativePath = calculateRelativePath(
            contentFilePath,
            imagePath
          );

          // Verify path starts with ./
          expect(relativePath).toMatch(/^\.\//);

          // Verify path preserves subfolder structure
          if (subfolders.length > 0) {
            const expectedSubfolderPath = subfolders.join("/");
            expect(relativePath).toContain(expectedSubfolderPath);
          }

          // Verify path ends with the image filename
          expect(relativePath).toMatch(new RegExp(`${imageFilename}$`));

          // Verify the path is correct by checking it resolves to the image
          const contentDir = dirname(contentFilePath);
          const resolvedPath = join(contentDir, relativePath);
          expect(resolvedPath).toBe(imagePath);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Relative path for flat file structure
   */
  it("calculates correct relative path for flat file structure", () => {
    fc.assert(
      fc.property(contentSlugArb, imageFilenameArb, (slug, imageFilename) => {
        const collectionPath = join(testDir, "collection");
        mkdirSync(collectionPath, { recursive: true });

        // Create flat file: my-post.md
        const contentFilePath = join(collectionPath, `${slug}.md`);
        writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

        // Create image in sibling folder: my-post/hero.jpg
        const imageFolder = join(collectionPath, slug);
        mkdirSync(imageFolder, { recursive: true });
        const imagePath = join(imageFolder, imageFilename);
        createTestFile(imagePath);

        // Calculate relative path
        const relativePath = calculateRelativePath(contentFilePath, imagePath);

        // For flat file, path should be ./slug/filename
        expect(relativePath).toBe(`./${slug}/${imageFilename}`);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Relative path for folder-based structure
   */
  it("calculates correct relative path for folder-based structure", () => {
    fc.assert(
      fc.property(contentSlugArb, imageFilenameArb, (slug, imageFilename) => {
        const collectionPath = join(testDir, "collection");
        const contentFolder = join(collectionPath, slug);
        mkdirSync(contentFolder, { recursive: true });

        // Create folder-based file: slug/index.md
        const contentFilePath = join(contentFolder, "index.md");
        writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

        // Create image in same folder: slug/hero.jpg
        const imagePath = join(contentFolder, imageFilename);
        createTestFile(imagePath);

        // Calculate relative path
        const relativePath = calculateRelativePath(contentFilePath, imagePath);

        // For folder-based, path should be ./filename (same directory)
        expect(relativePath).toBe(`./${imageFilename}`);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Relative path preserves nested subfolder structure
   */
  it("preserves nested subfolder structure in relative path", () => {
    fc.assert(
      fc.property(
        contentSlugArb,
        fc.array(dirNameArb, { minLength: 1, maxLength: 3 }),
        imageFilenameArb,
        (slug, subfolders, imageFilename) => {
          const collectionPath = join(testDir, "collection");
          const contentFolder = join(collectionPath, slug);
          mkdirSync(contentFolder, { recursive: true });

          // Create folder-based file: slug/index.md
          const contentFilePath = join(contentFolder, "index.md");
          writeFileSync(contentFilePath, "---\ntitle: Test\n---\nContent");

          // Create nested subfolder structure
          let imageDir = contentFolder;
          for (const subfolder of subfolders) {
            imageDir = join(imageDir, subfolder);
            mkdirSync(imageDir, { recursive: true });
          }

          // Create image in nested folder
          const imagePath = join(imageDir, imageFilename);
          createTestFile(imagePath);

          // Calculate relative path
          const relativePath = calculateRelativePath(
            contentFilePath,
            imagePath
          );

          // Verify path preserves subfolder structure
          const expectedPath = `./${subfolders.join("/")}/${imageFilename}`;
          expect(relativePath).toBe(expectedPath);
        }
      ),
      { numRuns: 100 }
    );
  });
});
