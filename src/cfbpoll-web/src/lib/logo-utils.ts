export function collectLogoUrls(...arrays: ReadonlyArray<{ logoURL: string }>[]): string[] {
  const urls = new Set<string>();
  for (const array of arrays) {
    for (const item of array) urls.add(item.logoURL);
  }
  return [...urls];
}
