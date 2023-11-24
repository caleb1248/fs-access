// @ts-ignore
import fileLoader from "./fileLoader.worker?worker";
import type { Folder } from "./fileTypes";

interface Options {
  version?: number;
  onTree: (tree: Folder) => void;
  onFile: (file: FileData) => void;
  onError?: (error: unknown) => void;
}

/**
 * File data sent from the worker.
 */
interface FileData {
  name: string;
  content: ArrayBuffer;
  binary: boolean;
}

// Data argument used for TypeScript purposes

function isTree(type: string, data: any): data is Folder {
  return type === "tree";
}

function isFile(type: string, data: any): data is FileData {
  return type === "file";
}

export default async function loadPackage(
  name: string,
  options: Options = { onTree() {}, onFile() {} }
) {
  options.onError = options.onError || console.error;
  const { version } = options;
  const worker: Worker = new fileLoader();
  worker.onmessage = (
    e: MessageEvent<{
      type: string;
      data: any;
    }>
  ) => {
    const { type, data } = e.data;

    if (!type || !data) throw "No data provided";

    if (isTree(type, data)) options.onTree(data);
    if (isFile(type, data)) options.onFile(data);
    if (type == "error") options.onError!(data);
  };

  worker.postMessage({ name, version });
}
