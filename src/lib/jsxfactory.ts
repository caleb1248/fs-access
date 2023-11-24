export default function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<
    HTMLElementTagNameMap[K] & { attributes: { [k: string]: string } }
  > | null,
  ...children: (string | Node)[]
) {
  props = props || {};
  children = !children ? [] : Array.isArray(children) ? children : [children];
  //@ts-ignore
  const { attributes, ...rest } = props;

  let element: HTMLElementTagNameMap[K] = Object.assign(
    document.createElement(tag),
    rest
  );
  element.replaceChildren(...children);

  if (attributes)
    for (const [name, value] of Object.entries(attributes))
      element.setAttribute(name, value);

  return element;
}
