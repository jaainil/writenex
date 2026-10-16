import writenex, {
  defineConfig,
  fields,
  type WritenexOptions,
} from "@imjp/writenex-astro";
import * as config from "@imjp/writenex-astro/config";
import * as discovery from "@imjp/writenex-astro/discovery";
import { createContent } from "@imjp/writenex-astro/filesystem";
import * as server from "@imjp/writenex-astro/server";
import * as fieldApi from "@imjp/writenex-astro/fields";
import "@imjp/writenex-astro/client";

const options: WritenexOptions = {};
const integration = writenex(options);
const title = fields.text({ label: "Title" });
const configuration = defineConfig({});
const create: typeof createContent = createContent;
void [
  integration,
  title,
  configuration,
  create,
  config,
  discovery,
  server,
  fieldApi,
];
