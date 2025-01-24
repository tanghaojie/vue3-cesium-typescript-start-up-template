// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const debounce = (fn: any, delay: number) => {
  let timer: number = -1
  function debounced() {
    clearTimeout(timer)
    timer = window.setTimeout(function () {
      fn()
    }, delay)
  }
  return debounced
}

export default debounce
