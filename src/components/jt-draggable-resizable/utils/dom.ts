import { isFunction } from './fns'

export function matchesSelectorToParentElements(
  el: HTMLElement,
  selector: any,
  baseNode: HTMLElement
) {
  let node: (Node & ParentNode) | null = el

  const matchesSelectorFunc = [
    'matches',
    'webkitMatchesSelector',
    'mozMatchesSelector',
    'msMatchesSelector',
    'oMatchesSelector',
  ].find((func) => isFunction((<any>node)[func]))

  if (!matchesSelectorFunc || !isFunction((<any>node)[matchesSelectorFunc]))
    return false

  do {
    if ((<any>node)[matchesSelectorFunc](selector)) return true
    if (node === baseNode) return false
    node = node.parentNode
  } while (node)

  return false
}

export function getComputedSize($el: HTMLElement) {
  const style = window.getComputedStyle($el)
  return [
    parseFloat(style.getPropertyValue('width')),
    parseFloat(style.getPropertyValue('height')),
  ]
}

export function addEvent(
  el: HTMLElement | undefined,
  event: string,
  handler: any
) {
  if (!el) {
    return
  }
  if ((<any>el).attachEvent) {
    ;(<any>el).attachEvent('on' + event, handler)
  } else if (el.addEventListener) {
    el.addEventListener(event, handler, true)
  } else {
    ;(<any>el)['on' + event] = handler
  }
}

export function removeEvent(
  el: HTMLElement | undefined,
  event: string,
  handler: any
) {
  if (!el) {
    return
  }
  if ((<any>el).attachEvent) {
    ;(<any>el).detachEvent('on' + event, handler)
  } else if (el.removeEventListener) {
    el.removeEventListener(event, handler, true)
  } else {
    ;(<any>el)['on' + event] = null
  }
}
