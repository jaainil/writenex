/** Keep requests on canonical host URLs, avoiding redirects of multipart bodies. */
export function apiUrl(path: string): string {
  if (
    typeof window === "undefined" ||
    !window.__WRITENEX_CONFIG__?.trailingSlash
  )
    return path;
  const index = path.indexOf("?");
  const pathname = index < 0 ? path : path.slice(0, index);
  return `${pathname.replace(/\/$/, "")}/${index < 0 ? "" : path.slice(index)}`;
}

export function apiRequest(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(apiUrl(path), options);
}

export function imageApiUrl(
  basePath: string,
  collection: string,
  contentId: string,
  path: string
): string {
  let image = path.replace(/^\.\//, "");
  const leaf = contentId.split("/").at(-1) ?? contentId;
  if (image.startsWith(`${contentId}/`))
    image = image.slice(contentId.length + 1);
  else if (image.startsWith(`${leaf}/`)) image = image.slice(leaf.length + 1);
  return apiUrl(
    `${basePath}/api/images/${encodeURIComponent(collection)}/${encodeURIComponent(contentId)}/${image.split("/").map(encodeURIComponent).join("/")}`
  );
}
