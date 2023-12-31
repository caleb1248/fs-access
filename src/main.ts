import "./style.css";
import "xterm/css/xterm.css";
import "./lib/splitpane/splitpane";
import "./lib/textmate/main";
import "./worker";

// import createTerminal from "./lib/webcontainer";
import fsWorker from "./lib/fsLoader.worker?worker";
import nodemodulesWorker from "./lib/nodemodules.worker?worker";
import prettier, { type BuiltInParserName } from "prettier";

import * as monaco from "monaco-editor";

import type { FileNode, FileSystemTree } from "@webcontainer/api";

let currentFile: FileSystemFileHandle;
let currentPath: string;
let currentFolder: FileSystemDirectoryHandle;

const fsLoader = new fsWorker();
const nodemodulesLoader = new nodemodulesWorker();

function clearModels() {
  monaco.editor.getModels().forEach((model) => model.dispose());
}

function fileContents({ file: { contents } }: FileNode) {
  return typeof contents === "string"
    ? contents
    : new TextDecoder().decode(contents);
}

document.querySelector("button#file")?.addEventListener("click", async () => {
  const [handle] = await showOpenFilePicker();

  if (await readWritePermission(handle)) {
    currentFile = handle;
    const file = await handle.getFile();
    const text = await file.text();
    currentPath = file.name;

    clearModels();
    const fileModel = monaco.editor.createModel(
      text,
      undefined,
      new monaco.Uri().with({ path: file.name })
    );
    editor.setModel(fileModel);
  } else alert("Error: Read/write access denied. Please try again.");
});

// @ts-ignore
document.querySelector("#folder")?.addEventListener("click", async () => {
  const handle = await showDirectoryPicker();

  if (await readWritePermission(handle)) {
    currentFolder = handle;

    fsLoader.onmessage = async (e) => {
      await Promise.all([/*createTerminal(e.data),*/ addModels(e.data)]);
      document.getElementById("main")!.style.gridTemplateRows = "1fr 300px";

      editor.setModel(
        monaco.editor.getModel(new monaco.Uri().with({ path: "/src/main.ts" }))
      );
    };

    fsLoader.postMessage(handle);
    clearModels();
  } else alert("Error: Read/write access denied. Please try again.");
});

async function addModels(tree: FileSystemTree, currentPath = "/") {
  const stack: Promise<void>[] = [];

  for (const fileName in tree) {
    const file = tree[fileName];
    if ("file" in file) {
      monaco.editor.createModel(
        fileContents(file),
        undefined,
        new monaco.Uri().with({ path: currentPath + fileName })
      );
    } else {
      if (fileName === "node_modules") {
        stack.push(addNodeModules(file.directory));
      } else {
        stack.push(addModels(file.directory, currentPath + fileName + "/"));
      }
    }
  }

  await Promise.all(stack);
}

async function addNodeModules(data: FileSystemTree) {
  nodemodulesLoader.postMessage(data);
}

async function save() {
  if (!currentFile) throw "No current file";
  const currentModel = editor.getModel();
  if (!currentModel) throw "No current model";

  const writer = (await currentFile.createWritable()).getWriter();
  writer.write(currentModel.getValue());
  writer.close();
}

window.addEventListener("keydown", (e) => {
  if (!e.repeat && e.ctrlKey && e.key === "s") {
    e.preventDefault();
    save();
  }
});

async function readWritePermission(handle: FileSystemHandle) {
  let permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission == "granted") return true;

  permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission == "granted") return true;

  return false;
}

const editorDiv = document.createElement("div");
editorDiv.id = "editor";

document.querySelector("#editor-container")?.appendChild(editorDiv);

const editor = monaco.editor.create(editorDiv, {
  theme: "darkplus",
  automaticLayout: true,
});

clearModels();

monaco.editor.registerEditorOpener({
  openCodeEditor(source, resource) {
    source.setModel(monaco.editor.getModel(resource));
    return true;
  },
});

const usePrettier: (
  parser: BuiltInParserName
) => monaco.languages.DocumentFormattingEditProvider = (parser) => ({
  async provideDocumentFormattingEdits(model) {
    const text = await prettier.format(model.getValue(), {
      singleQuote: true,
      parser,
    });

    return [
      {
        range: model.getFullModelRange(),
        text,
      },
    ];
  },
});

monaco.languages.registerDocumentFormattingEditProvider(
  "javascript",
  usePrettier("typescript")
);

monaco.languages.registerDocumentFormattingEditProvider(
  "typescript",
  usePrettier("typescript")
);

monaco.languages.registerDocumentFormattingEditProvider(
  "css",
  usePrettier("css")
);

monaco.languages.registerDocumentFormattingEditProvider(
  "json",
  usePrettier("json")
);

monaco.languages.registerDocumentFormattingEditProvider(
  "html",
  usePrettier("html")
);
