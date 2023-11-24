interface FolderFile {
  name: string;
  fullPath: string;
  type: "File";
}

interface Folder {
  name: string;
  contents: (FolderFile | Folder)[];
  type: "Folder";
}

interface FileInfo {
  name: string;
  type: string;
  size: number;
  header_offset: number;
}

export type { Folder, FolderFile, FileInfo };
