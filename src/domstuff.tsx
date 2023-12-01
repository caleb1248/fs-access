import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker: function (_: string, label: string) {
    switch (label) {
      case "json":
        return new jsonWorker();
      case "css":
      case "scss":
      case "less":
        return new cssWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker();
      case "typescript":
      case "javascript":
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};
import fsWorker from "./lib/fsLoader.worker?worker";
import createTerminal from "./lib/webcontainer";

let currentFile: FileSystemFileHandle;
let currentPath: string;
let currentFolder: FileSystemDirectoryHandle;

const fsLoader = new fsWorker();

function clearModels() {
  monaco.editor.getModels().forEach((model) => model.dispose());
}

async function openFile() {
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
}

async function openFolder() {
  const handle = await showDirectoryPicker();

  if (await readWritePermission(handle)) {
    currentFolder = handle;

    fsLoader.onmessage = async (e) => {
      const { terminal, terminalDiv, webcontainer } = await createTerminal(
        e.data
      );
    };

    fsLoader.postMessage(handle);
    clearModels();
    // const fileModel = monaco.editor.createModel(
    //   text,
    //   undefined,
    //   new monaco.Uri().with({ path: file.name })
    // );
    // editor.setModel(fileModel);
  } else alert("Error: Read/write access denied. Please try again.");
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

const editorDiv = <div id="editor"></div>;

const editor = monaco.editor.create(editorDiv, {
  theme: "vs-dark",
  automaticLayout: true,
});

clearModels();

const app = (
  <div id="app">
    <div id="sidebar">
      <button on:click={() => openFile()}>Open File</button>
      <button on:click={() => openFolder()}>Open Folder</button>
    </div>
    <div className="horizontal-resizer"></div>
    <div id="main">
      {editorDiv}
      <div class="vertical-resizer"></div>
      <div id="terminalContainer">
        <div className="terminal"></div>
      </div>
    </div>
  </div>
);

export default app;
