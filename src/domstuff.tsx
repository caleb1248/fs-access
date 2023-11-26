import * as monaco from "monaco-editor";

let currentFile: FileSystemFileHandle;
let currentFolder: FileSystemDirectoryHandle;

function clearModels() {
  monaco.editor.getModels().forEach((model) => model.dispose());
}

async function openFile() {
  const [handle] = await showOpenFilePicker();

  if (await readWritePermission(handle)) {
    currentFile = handle;
    const file = await handle.getFile();
    const text = await file.text();

    clearModels();
    const fileModel = monaco.editor.createModel(
      text,
      undefined,
      new monaco.Uri().with({ path: file.name })
    );

    editor.setModel(fileModel);
  } else alert("Error: Read/write access denied. Please try again.");
}

async function save() {
  const writer = (await currentFile.createWritable()).getWriter();
  writer.write(monaco.editor.getModel(new monaco.Uri()));
}

window.addEventListener("keydown", ({ repeat, key, ctrlKey }) => {
  if (!repeat && ctrlKey && key === "s") save();
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

const app = (
  <div id="app">
    <div id="sidebar">
      <button on:click={() => openFile()}>Open File</button>
      <button on:click={() => alert("hi")}>Open Folder</button>
    </div>
    {editorDiv}
  </div>
);

export default app;
