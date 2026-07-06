/**
 * @fileoverview Next.js page handler for the Writenex editor UI
 */

import { generateEditorHtml } from "@imjp/writenex-core/server";

export function createWritenexPageHandler() {
  return function WritenexPage() {
    const html = generateEditorHtml("/_writenex");
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        suppressHydrationWarning
      />
    );
  };
}
