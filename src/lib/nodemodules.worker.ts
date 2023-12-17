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
  if (!data) return;
  const packageJSON = data["package.json"] as FileNode | undefined;
  if (!packageJSON) {
    console.error(
      "Error: no package.json file was found in package " + packageName
    );

    return;
  }

  const json = JSON.parse(fileContents(packageJSON));
  const types = json.typings || json.types;
  console.log(packageName, types);
}

self.addEventListener("message", (e) => {
  const data: FileSystemTree = e.data;

  for (const folderName in data) {
    if (folderName.startsWith("@")) {
      for (const orgFolder in data[folderName]) {
        const folder = (<DirectoryNode>(
          (<DirectoryNode>data[folderName]).directory[orgFolder]
        )).directory;
        loadNodeModule(folder, `${folderName}/${orgFolder}`);
      }
      continue;
    }

    const folder = (<DirectoryNode>data[folderName]).directory;
    loadNodeModule(folder, folderName);
  }
});
