import "./splitpane.css";
setTimeout(() => {
  horizontal(document.querySelector("#app") as HTMLDivElement);
});

function horizontal(div: HTMLDivElement) {
  let hovering = false;
  let dragging = false;
  div.addEventListener("mousemove", (e) => {
    if (dragging) {
    } else {
      const leftElem = div.children[0] as HTMLElement;
      const { right } = leftElem.getBoundingClientRect();
      hovering = e.clientX - right < 10;
      div.style.cursor = dragging || hovering ? "ew-resize" : "default";
    }
  });

  div.addEventListener("mousedown", (e) => {
    if (hovering) {
    }
  });
}
