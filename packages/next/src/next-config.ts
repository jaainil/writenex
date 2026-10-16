import type { NextConfig } from "next";

export type NextConfigFunction = (
  phase: string,
  context: { defaultConfig: NextConfig }
) => NextConfig | Promise<NextConfig>;

function compose(config: NextConfig): NextConfig {
  const includes = config.outputFileTracingIncludes ?? {};
  return {
    ...config,
    serverExternalPackages: [
      ...new Set([
        ...(config.serverExternalPackages ?? []),
        "@imjp/writenex-next",
      ]),
    ],
    outputFileTracingIncludes: {
      ...includes,
      "/*": [
        ...new Set([
          ...(includes["/*"] ?? []),
          "./node_modules/@imjp/writenex-next/dist/client/**/*",
          "./writenex.config.{ts,mts,js,mjs,cjs}",
        ]),
      ],
    },
  };
}

export function withWritenex(config: NextConfigFunction): NextConfigFunction;
export function withWritenex(config?: NextConfig): NextConfig;
export function withWritenex(
  config: NextConfig | NextConfigFunction = {}
): NextConfig | NextConfigFunction {
  if (typeof config === "function") {
    return async (phase, context) => compose(await config(phase, context));
  }
  return compose(config);
}
