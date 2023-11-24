export async function fetchLatest(name: string) {
  const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
  const { version } = await res.json();
  return version;
}

export async function fetchPackage(packageName: string, version?: string) {
  const pkgVersion = version || (await fetchLatest(packageName));
  const res = await fetch(
    `https://registry.npmjs.org/${packageName}/-/${packageName}-${pkgVersion}.tgz`
  );

  if (res.status === 404 || !res.body) throw "Failed to fetch package";

  return await new Response(
    res.body.pipeThrough(new DecompressionStream("gzip"))
  ).arrayBuffer();
}
