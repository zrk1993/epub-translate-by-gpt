export function debounce(fn: () => void, delay: number) {
  let time = null;
  return function () {
    if (time !== null) {
      clearTimeout(time);
    }
    time = setTimeout(() => {
      fn.call(this);
    }, delay)
  }
}

export function delay(d: number) {
  return new Promise((r) => {
    setTimeout(r, d);
  })
}