/// <reference lib="WebWorker"/>

import type {
  DirectoryNode,
  FileNode,
  FileSystemTree,
} from "@webcontainer/api";

declare var self: DedicatedWorkerGlobalScope;

function fileContents({ file: { contents } }: FileNode) {
  return typeof contents === "string"
    ? contents
    : new TextDecoder().decode(contents);
}

async function loadNodeModule(data: FileSystemTree, packageName: string) {
  let noPackageJson = false;
  const folder = (<DirectoryNode>data[packageName]).directory;
  if (!folder) return;
  const packageJSON = folder["package.json"] as FileNode | undefined;
  if (!packageJSON) {
    console.error(
      "Error: no package.json file was found in package " + packageName
    );

    return;
  }

  const json = JSON.parse(fileContents(packageJSON));
  const types = json.typings || json.types;
  console.log(types);
}

self.addEventListener("message", (e) => {
  const data: FileSystemTree = e.data;

  for (const folderName in data) {
    // TODO: add support for org scopes

    const folder = (<DirectoryNode>data[foerName]).directory;
    loadNodeModule();
  }
});
