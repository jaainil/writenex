# Writenex Next.js integration

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers and content authors editing Markdown/MDX files in a Next.js project.

## Product Purpose

Bring Writenex's existing visual content editor to Next.js without requiring Astro. Save edits directly into the consuming project's filesystem.

## Operating Context

The editor runs beside the host application through a Node.js App Router route. Development editing is the default; production requires explicit authenticated opt-in and persistent writable storage.

## Capabilities and Constraints

Preserve collection discovery, frontmatter forms, visual/source editing, images, autosave, search, previews, and version history. Protect content paths and keep runtime state isolated between projects. Static export, Edge, and ephemeral storage cannot provide durable editing.

## Brand Commitments

Inherit the existing Writenex editor identity and Astro editor visual system. Identify this integration as Next.js without redesigning the workspace.

## Product Principles

- Keep installation independent of Astro.
- Preserve writing, versions, and portable file formats.
- Keep production editing closed without complete authentication.
- Retain keyboard access, themes, and the established editor controls.

## Evidence on Hand

The shared implementation is in `../astro/src/`; adapter code and tests live here. The consumer fixture validates the packed package in a real Next.js project.
