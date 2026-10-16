export interface SearchMatch {
  index: number;
  length: number;
}

export function findSearchMatches(
  content: string,
  query: string,
  options: { regex: boolean; caseSensitive: boolean; wholeWord: boolean }
): SearchMatch[] {
  if (!query) return [];
  let expression = options.regex
    ? query
    : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (options.wholeWord) expression = `\\b(?:${expression})\\b`;
  try {
    const pattern = new RegExp(expression, options.caseSensitive ? "g" : "gi");
    // matchAll advances zero-length matches, unlike a manual RegExp.exec loop.
    return Array.from(content.matchAll(pattern), (match) => ({
      index: match.index,
      length: match[0].length,
    }));
  } catch {
    return [];
  }
}
