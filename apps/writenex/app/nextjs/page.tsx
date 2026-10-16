import { ArrowRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { codeToHtml } from "shiki";
import packageInfo from "../../../../packages/next/package.json";
import { LandingFooter, LandingHeader } from "../components/landing";
import { createBreadcrumbSchema } from "../lib/jsonld";

export const metadata: Metadata = {
  title: "@imjp/writenex-next - Visual Editor for Next.js",
  description:
    "Visual Markdown and MDX editing for Next.js App Router projects. Set up content collections, frontmatter fields, image uploads, and version history.",
  alternates: { canonical: "https://writenex.com/nextjs" },
  openGraph: {
    title: "@imjp/writenex-next - Visual Editor for Next.js",
    description:
      "Edit Markdown and MDX files inside your Next.js project with Writenex.",
    url: "https://writenex.com/nextjs",
  },
};

const setup = [
  {
    title: "Install the package",
    file: "terminal",
    lang: "sh",
    code: "npm install @imjp/writenex-next",
  },
  {
    title: "Connect your Next.js configuration",
    file: "next.config.mjs",
    lang: "js",
    code: `import { withWritenex } from "@imjp/writenex-next";

export default withWritenex({
  // Keep your existing Next.js options here.
});`,
  },
  {
    title: "Create the editor route",
    file: "app/%5Fwritenex/[[...path]]/route.ts",
    lang: "ts",
    code: `import { createWritenexHandler } from "@imjp/writenex-next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createWritenexHandler();
export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;`,
  },
  {
    title: "Start editing",
    file: "terminal",
    lang: "sh",
    code: "npm run dev\n# Open http://localhost:3000/_writenex",
  },
];

const collectionExample = `import { defineConfig, collection, fields } from "@imjp/writenex-next/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "content/blog",
      filePattern: "{slug}.mdx",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.text({
          label: "Title",
          validation: { isRequired: true },
        }),
        description: fields.text({ label: "Description", multiline: true }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        body: fields.mdx({ label: "Content" }),
      },
    }),
  ],
  editor: { autosave: true, autosaveInterval: 3000 },
  images: { strategy: "colocated" },
  versionHistory: { enabled: true, maxVersions: 20 },
});`;

const features = [
  [
    "Visual Markdown & MDX",
    "Write with the visual editor or switch to source mode. Content stays in your project as Markdown and MDX files.",
  ],
  [
    "Content collections",
    "Discover collections inside content/ and src/content/, or choose explicit paths in writenex.config.ts.",
  ],
  [
    "Typed frontmatter",
    "Use the shared Fields API for text, selections, dates, images, structured data, validation, and more.",
  ],
  [
    "Image uploads",
    "Upload images alongside content or into your public directory with the same storage strategies as Astro.",
  ],
  [
    "Version history",
    "Save automatic snapshots and restore earlier drafts. Version files stay on your project's filesystem.",
  ],
  [
    "Your existing site",
    "The editor runs in its own HTML document. Its styles and bundled React stay outside your site's layouts.",
  ],
];

const runtimeOptions = [
  [
    "projectRoot",
    "process.cwd()",
    "Project directory for content and configuration.",
  ],
  [
    "basePath",
    '"/_writenex"',
    "Full public editor URL, including the host basePath.",
  ],
  [
    "nextBasePath",
    '""',
    "Host basePath removed by Next.js before route handling.",
  ],
  [
    "contentDirs",
    '["content", "src/content"]',
    "Ordered discovery roots; the first matching collection wins.",
  ],
  [
    "trailingSlash",
    "unspecified",
    "Match your Next.js preview URL convention.",
  ],
  [
    "maxBodyBytes",
    "10485760",
    "Request body limit, including multipart uploads.",
  ],
  [
    "allowProduction",
    "false",
    "Enable production editing with complete authentication.",
  ],
  [
    "remoteCms",
    "config file",
    "CMS authentication settings; keep credentials server-side.",
  ],
];

async function CodeBlock({
  file,
  code,
  lang,
}: {
  file: string;
  code: string;
  lang: string;
}) {
  const html = await codeToHtml(code, { lang, theme: "github-dark" });
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
      <div className="break-all border-b border-zinc-700 px-4 py-3 font-mono text-sm text-zinc-300">
        {file}
      </div>
      <div
        className="text-sm [&_pre]:overflow-x-auto [&_pre]:p-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export default async function NextjsPage() {
  const breadcrumb = createBreadcrumbSchema([
    { name: "Home", url: "https://writenex.com" },
    { name: "@imjp/writenex-next", url: "https://writenex.com/nextjs" },
  ]);
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <LandingHeader />
      <main>
        <section className="px-4 pt-48 pb-20 sm:px-6 sm:pt-40 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              Visual Editor for
              <br />
              <span className="text-brand-500 dark:text-brand-400">
                Next.js Content
              </span>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
              Visual Markdown and MDX editing, typed frontmatter, image uploads,
              and version history. All inside your Next.js project.
            </p>
            <p className="mb-8 break-words text-sm text-zinc-600 dark:text-zinc-400">
              @imjp/writenex-next · v{packageInfo.version} · Next.js 15 & 16 ·
              App Router · Node.js
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#quick-start"
                className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-lg text-white"
              >
                Get started <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="https://www.npmjs.com/package/@imjp/writenex-next"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-5 py-3 text-lg text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                View on npm <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>
        <section
          id="quick-start"
          className="scroll-mt-44 bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50"
        >
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
              Quick Start
            </h2>
            <p className="mb-12 text-center text-lg text-zinc-600 dark:text-zinc-400">
              Connect the App Router route, then open your editor.
            </p>
            <div className="space-y-10">
              {setup.map((step) => (
                <div key={step.file + step.title}>
                  <h3 className="mb-4 text-xl font-semibold">{step.title}</h3>
                  <CodeBlock {...step} />
                  {step.title === "Create the editor route" && (
                    <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Use the literal <code>%5Fwritenex</code> folder name:
                      Next.js treats folders starting with an underscore as
                      private. Keep <code>[[...path]]</code> to serve the
                      editor, API, and assets. Projects using{" "}
                      <code>src/app</code> should create the route there. Do not
                      add a page.tsx alongside it.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
              The Writenex editing experience
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700"
                >
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Content collections & Fields API
            </h2>
            <p className="mb-6 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
              Subdirectories of <code>content/</code> and{" "}
              <code>src/content/</code> become collections automatically.
              Frontmatter forms are inferred from existing files. For explicit
              fields and preview URLs, add a configuration file:
            </p>
            <CodeBlock
              file="writenex.config.ts"
              code={collectionExample}
              lang="ts"
            />
            <p className="mt-6 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
              Configured paths take precedence. Set{" "}
              <code>discovery: {"{ enabled: false }"}</code> to use only
              configured collections. The Fields API matches Astro; import{" "}
              <code>defineConfig</code>, <code>collection</code>,{" "}
              <code>singleton</code>, and <code>fields</code> from{" "}
              <code>@imjp/writenex-next/config</code>.
            </p>
            <p className="mt-4 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
              Preview URLs must match your own site routes. Use source mode for
              custom MDX components or expressions that the visual editor cannot
              round-trip, and verify the result in your site's preview.
            </p>
          </div>
        </section>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Runtime configuration
            </h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Pass these options to <code>createWritenexHandler()</code> in your
              route file.
            </p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Next.js editor handler options
                </caption>
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    {["Option", "Default", "Purpose"].map((label) => (
                      <th key={label} scope="col" className="p-4 font-semibold">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runtimeOptions.map(([option, defaultValue, purpose]) => (
                    <tr
                      key={option}
                      className="border-t border-zinc-200 dark:border-zinc-700"
                    >
                      <th scope="row" className="p-4 font-mono font-normal">
                        {option}
                      </th>
                      <td className="p-4 font-mono">{defaultValue}</td>
                      <td className="min-w-56 p-4 text-zinc-600 dark:text-zinc-400">
                        {purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-8 mb-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
              If your Next.js site uses <code>basePath: "/docs"</code>, keep the
              encoded route folder and configure both paths:
            </p>
            <CodeBlock
              file="route.ts — host basePath example"
              lang="ts"
              code={
                'const handler = createWritenexHandler({\n  basePath: "/docs/_writenex",\n  nextBasePath: "/docs",\n  // Set trailingSlash: true if enabled in next.config.\n});'
              }
            />
          </div>
        </section>
        <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-zinc-800/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Production & authentication
            </h2>
            <p className="mb-6 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
              The editor returns 404 in production by default. Enable it only on
              a Node.js server with persistent writable storage and complete
              authentication.
            </p>
            <CodeBlock
              file="route.ts — production opt-in"
              lang="ts"
              code={
                "const handler = createWritenexHandler({\n  allowProduction: true,\n  remoteCms: { enabled: true },\n});"
              }
            />
            <div className="mt-6">
              <CodeBlock
                file="Server environment variables"
                lang="sh"
                code={
                  "WRITENEX_CMS_USER=your-admin-username\nWRITENEX_CMS_PASS=your-strong-password\nWRITENEX_SECRET=your-long-random-signing-secret"
                }
              />
            </div>
            <p className="mt-6 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
              Keep credentials server-side; never use NEXT_PUBLIC_ variables.
              Missing credentials or a signing secret keep the editor closed.
              Use HTTPS and preserve content, image, and .writenex/versions
              directories across deployments.
            </p>
            <p className="mt-4 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
              Edge runtime, static export, and read-only or ephemeral serverless
              storage cannot support durable editing. Installing this package on
              Vercel does not sync edits to Git. Pages Router and Git
              synchronization are not included.
            </p>
          </div>
        </section>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold sm:text-4xl">
              Troubleshooting
            </h2>
            <dl className="space-y-6">
              {[
                [
                  "404 in development",
                  "Check the literal %5Fwritenex directory, optional catch-all brackets, App Router location, and all route exports.",
                ],
                [
                  "No collections",
                  "Create content/blog/ with Markdown or MDX files, or configure the exact collection path. Symlinks in editable paths are refused.",
                ],
                [
                  "Missing editor assets",
                  "Wrap your existing config with withWritenex and match the handler basePath to the public URL.",
                ],
                [
                  "Uploads return 413",
                  "Increase maxBodyBytes for the full multipart body and check your reverse proxy limits.",
                ],
                [
                  "Changes to configuration do not appear",
                  "Restart the server after changing writenex.config.ts.",
                ],
              ].map(([title, text]) => (
                <div key={title}>
                  <dt className="mb-2 text-lg font-semibold">{title}</dt>
                  <dd className="max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {text}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-12 flex flex-wrap gap-6">
              <a
                className="text-brand-600 dark:text-brand-400 underline underline-offset-4"
                href="https://github.com/jaainil/writenex/blob/main/packages/next/README.md"
              >
                Full package reference
              </a>
              <Link
                className="text-brand-600 dark:text-brand-400 underline underline-offset-4"
                href="/astro"
              >
                Building with Astro? Read the Astro docs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
