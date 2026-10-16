// Next.js handles stylesheet imports during bundling; expose that contract to
// the Vite+ type checker as well as the framework's TypeScript compiler.
declare module "*.css";
