export default function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<
    HTMLElementTagNameMap[K] & { attributes: { [k: string]: string } }
  >,
  children: (string | Node)[]
) {
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
