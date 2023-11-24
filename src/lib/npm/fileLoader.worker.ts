/// <reference lib="WebWorker"/>

declare var self: DedicatedWorkerGlobalScope;

import { Buffer } from "buffer";
import { isBinary } from "./textorbinary";
import { fetchPackage } from "./fetcher";
import type { Folder, FolderFile, FileInfo } from "./fileTypes";

class TarReader {
  fileInfo: FileInfo[];
  buffer: ArrayBuffer;
  constructor() {
    this.fileInfo = [];
    // @ts-ignore
    this.buffer = undefined;
  }
  readFile(file: Blob): Promise<FileInfo[]> {
    return new Promise((resolve, _reject) => {
      let reader = new FileReader();
      reader.onload = (event) => {
        this.buffer = event.target?.result as ArrayBuffer;
        this.fileInfo = [];
        this._readFileInfo();
        resolve(this.fileInfo);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  readArrayBuffer(arrayBuffer: ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.fileInfo = [];
    this._readFileInfo();
    return this.fileInfo;
  }

  _readFileInfo() {
    this.fileInfo = [];
    let offset = 0;
    let size = 0;
    let name = "";
    let type = null;
    while (offset < this.buffer?.byteLength - 512) {
      name = this._readFileName(offset); // file name
      if (name.length == 0) {
        break;
      }
      type = this._readFileType(offset);
      size = this._readFileSize(offset);

      this.fileInfo.push({
        name,
        type,
        size,
        header_offset: offset,
      });

      offset += 512 + 512 * Math.trunc(size / 512);
      if (size % 512) {
        offset += 512;
      }
    }
  }

  getFileInfo() {
    return this.fileInfo;
  }

  _readString(str_offset: number, size: number) {
    let strView = new Uint8Array(this.buffer, str_offset, size);
    let i = strView.indexOf(0);
    let td = new TextDecoder();
    return td.decode(strView.slice(0, i));
  }

  _readFileName(header_offset: number) {
    let name = this._readString(header_offset, 100);
    return name;
  }

  _readFileType(header_offset: number) {
    // offset: 156
    let typeView = new Uint8Array(this.buffer, header_offset + 156, 1);
    let typeStr = String.fromCharCode(typeView[0]);
    if (typeStr == "0") {
      return "file";
    } else if (typeStr == "5") {
      return "directory";
    } else {
      return typeStr;
    }
  }

  _readFileSize(header_offset: number) {
    // offset: 124
    let szView = new Uint8Array(this.buffer, header_offset + 124, 12);
    let szStr = "";
    for (let i = 0; i < 11; i++) {
      szStr += String.fromCharCode(szView[i]);
    }
    return parseInt(szStr, 8);
  }

  _readFileBlob(file_offset: number, size: number, type: string) {
    let view = new Uint8Array(this.buffer, file_offset, size);
    let blob = new Blob([view], { type });
    return blob;
  }

  _readFileBinary(file_offset: number, size: number) {
    let view = new Uint8Array(this.buffer, file_offset, size);
    return view;
  }

  _readTextFile(file_offset: number, size: number) {
    let view = new Uint8Array(this.buffer, file_offset, size);
    let td = new TextDecoder();
    return td.decode(view);
  }

  getTextFile(file_name: string) {
    let info = this.fileInfo.find((info) => info.name == file_name);
    if (info) {
      return this._readTextFile(info.header_offset + 512, info.size);
    }
  }

  getFileBlob(file_name: string, mimetype: string) {
    let info = this.fileInfo.find((info) => info.name == file_name);
    if (info) {
      return this._readFileBlob(info.header_offset + 512, info.size, mimetype);
    }
  }

  getFileBinary(file_name: string) {
    let info = this.fileInfo.find((info) => info.name == file_name);
    if (info) {
      return this._readFileBinary(info.header_offset + 512, info.size);
    }
  }
}

const reader = new TarReader();

function file(name: string, fullPath: string): FolderFile {
  return { name, fullPath, type: "File" };
}

function folder(name: string): Folder {
  return { name, contents: [], type: "Folder" };
}

function fileListToTree() {
  const nameList = reader.fileInfo
    .filter(({ type }) => type !== "directory")
    .map(({ name }) => name.replace("package/", ""));

  const root = folder("");

  for (const name of nameList) {
    const pathSegments = name.split("/"),
      fileName = pathSegments.pop()!;

    let currentFolder = root;

    for (const segment of pathSegments)
      currentFolder = (currentFolder.contents.find(
        ({ name }) => name === segment
      ) ||
        currentFolder.contents[
          currentFolder.contents.push(folder(segment)) - 1
        ]) as Folder;

    currentFolder.contents.push(file(fileName, name));
  }

  return root.contents;
}

self.addEventListener("message", async (e) => {
  const { name, version } = e.data;
  const tgz = await fetchPackage(name, version);
  reader.readArrayBuffer(tgz);

  const data = fileListToTree();

  self.postMessage({ type: "tree", data });

  for (const { name } of reader.fileInfo.filter((f) => f.type != "directory")) {
    try {
      const content = reader.getFileBinary(name);

      if (!content) throw 'File "' + name + '" not found';

      self.postMessage({
        type: "file",
        data: {
          name,
          content: content.buffer,
          binary: isBinary(name, Buffer.from(content.buffer)),
        },
      });
    } catch (e) {
      self.postMessage({ type: "error", data: e });
    }
  }
});
