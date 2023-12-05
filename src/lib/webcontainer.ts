import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

async function createTerminal(files: FileSystemTree) {
  console.log("booting webcontainer...");
  const webcontainer = await WebContainer.boot();
  console.log("mounting files...");
  webcontainer.mount(files);

  const terminalDiv = document.getElementById("terminal")!;

  const fitAddon = new FitAddon();

  const terminal = new Terminal({ convertEol: true });
  terminal.loadAddon(fitAddon);
  terminal.open(terminalDiv);

  const shellProcess = await webcontainer.spawn("jsh", {
    terminal: {
      cols: terminal.cols,
      rows: terminal.rows,
    },
  });

  terminal.onResize(() => fitAddon.fit());

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    })
  );

  window.addEventListener("resize", () => {
    fitAddon.fit();
    shellProcess.resize({
      cols: terminal.cols,
      rows: terminal.rows,
    });
  });

  const input = shellProcess.input.getWriter();
  terminal.onData((data) => {
    input.write(data);
  });
  return { webcontainer, terminal, terminalDiv };
}

export default createTerminal;
