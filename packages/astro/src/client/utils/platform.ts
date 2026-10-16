export function isNextEditor(): boolean {
  return (
    typeof window !== "undefined" &&
    window.__WRITENEX_CONFIG__?.platform === "next"
  );
}

export function isNarrowNextEditor(): boolean {
  return isNextEditor() && window.matchMedia("(max-width: 767px)").matches;
}
