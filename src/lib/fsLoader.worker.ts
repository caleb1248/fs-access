/// <reference lib="WebWorker"/>
import type { FileSystemTree } from "@webcontainer/api";
declare var self: DedicatedWorkerGlobalScope;
self.addEventListener("message", async (e) => {
  const buffersToTransfer: ArrayBuffer[] = [];

  async function getContents(folder: FileSystemDirectoryHandle) {
    const dir: FileSystemTree = {};
    for await (const value of folder.values()) {
      if (value.kind == "directory") {
        dir[value.name] = {
          directory: await getContents(value),
        };
      } else if (value.kind == "file") {
        const buffer = await (await value.getFile()).arrayBuffer();
        buffersToTransfer.push(buffer);
        dir[value.name] = {
          file: {
            contents: new Uint8Array(buffer),
          },
        };
      }
    }

    return dir;
  }

  const output = await getContents(e.data);

  self.postMessage(output, buffersToTransfer);
});
