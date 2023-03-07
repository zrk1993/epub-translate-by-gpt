export function debounce(fn: () => void, delay: number) {
  // 存储定时标识符，以便清除定时器
  let timer = null
  return function _debounce() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn()
    }, delay)
  }
}

export async function delay(t: number) {
  return new Promise(resolve => setTimeout(resolve, t))
}