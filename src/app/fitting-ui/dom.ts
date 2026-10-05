// Телеметрия обновляется часто; сохраняем DOM controls, чтобы touch/click и фокус
// не терялись между pointerdown и pointerup из-за очередного Worker chunk.
export function updateDom(root: HTMLElement, html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  patch(root, template.content);
}
function patch(parent: Node, next: Node) {
  let i = 0;
  while (i < next.childNodes.length || i < parent.childNodes.length) {
    const old = parent.childNodes[i],
      fresh = next.childNodes[i];
    if (!fresh) {
      parent.removeChild(old);
      continue;
    }
    if (!old) {
      parent.appendChild(fresh.cloneNode(true));
      i++;
      continue;
    }
    if (
      old.nodeType !== fresh.nodeType ||
      (old instanceof Element &&
        fresh instanceof Element &&
        (old.tagName !== fresh.tagName || old.id !== fresh.id))
    ) {
      parent.replaceChild(fresh.cloneNode(true), old);
      i++;
      continue;
    }
    if (old instanceof Element && fresh instanceof Element) {
      if (old.id === "ui-dialog") {
        i++;
        continue;
      }
      for (const attr of [...old.attributes])
        if (
          !fresh.hasAttribute(attr.name) &&
          !(old instanceof HTMLDetailsElement && attr.name === "open")
        )
          old.removeAttribute(attr.name);
      for (const attr of [...fresh.attributes])
        if (old.getAttribute(attr.name) !== attr.value)
          old.setAttribute(attr.name, attr.value);
      patch(old, fresh);
      if (
        old instanceof HTMLInputElement &&
        fresh instanceof HTMLInputElement
      ) {
        if (old.type === "checkbox") old.checked = fresh.checked;
        else if (document.activeElement !== old && old.value !== fresh.value)
          old.value = fresh.value;
      }
      if (
        old instanceof HTMLSelectElement &&
        fresh instanceof HTMLSelectElement &&
        document.activeElement !== old
      )
        old.value = fresh.value;
    } else if (old.nodeValue !== fresh.nodeValue)
      old.nodeValue = fresh.nodeValue;
    i++;
  }
}
