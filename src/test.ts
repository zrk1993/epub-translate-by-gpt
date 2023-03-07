import pLimit from 'p-limit';

const limit = pLimit(2);

const st = Date.now()


async function fetchSomething(params: string) {
  return new Promise(r => {
    setTimeout(() => {
      r(params + params)
    }, 2000)
  })
}

async function main() {
  for (let index = 0; index < 10000; index++) {
    console.log(index)
    const res = await limit(() => fetchSomething('foo' + index))
    console.log(res)
  }
}
// const input = [
// 	limit(() => fetchSomething('foo')),
// 	limit(() => fetchSomething('bar')),
// 	limit(() => fetchSomething('goo'))
// ];

// // Only one promise is run at once
// const result = await Promise.all(input);
// console.log(result);
// console.log((Date.now() - st) / 1000)

main()