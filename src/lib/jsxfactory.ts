const elementFactory = function <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { attributes?: { [k: string]: string }; [k: string]: unknown } | null,
  ...children: (string | Node)[]
) {
  props = props || {};
  children = !children ? [] : Array.isArray(children) ? children : [children];
  //@ts-ignore
  const { attributes, ...rest } = props;

  const eventListeners: { type: string; listener: EventListener }[] = [];

  for (const key in rest) {
    if (key.startsWith("on:")) {
      eventListeners.push({
        type: key.replace("on:", ""),
        listener: rest[key] as EventListener,
      });

      delete rest[key];
    }
  }

  let element: HTMLElementTagNameMap[K] = Object.assign(
    document.createElement(tag),
    rest
  );

  for (const { type, listener } of eventListeners)
    element.addEventListener(type, listener);

  element.replaceChildren(...children);

  if (attributes)
    for (const [name, value] of Object.entries(attributes))
      element.setAttribute(name, value);

  return element;
};

declare var element: typeof elementFactory;
self.element = elementFactory;
