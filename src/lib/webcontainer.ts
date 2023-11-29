import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";

async function createTerminal(files: FileSystemTree) {
  console.log("booting webcontainer...");
  const webcontainer = await WebContainer.boot();
  console.log("mounting files...");
  webcontainer.mount(files);

  console.log("Yay");

  const terminalDiv = document.querySelector(".terminal") as HTMLDivElement;

  const terminal = new Terminal({ convertEol: true });
  terminal.open(terminalDiv);
  setTimeout(
    () =>
      document.querySelector(".terminalContainer")?.appendChild(terminalDiv),
    1000
  );

  const shellProcess = await webcontainer.spawn("jsh");

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    })
  );

  const input = shellProcess.input.getWriter();
  terminal.onData((data) => {
    input.write(data);
  });
  return { webcontainer, terminal, terminalDiv };
}

export default createTerminal;
