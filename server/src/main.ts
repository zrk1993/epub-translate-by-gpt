import * as dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'

dotenv.config()

const msg = `
将下面的HTML文档中的英文替换为中文，保留HTML标签
<p><span class="audio" id="c001s0001">Call me Ishmael.</span> <span class="audio" id="c001s0002">Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.</span> <span class="audio" id="c001s0003">It is a way I have of driving off the spleen and regulating the circulation.</span> <span class="audio" id="c001s0004">Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can.</span> <span class="audio" id="c001s0005">This is my substitute for pistol and ball.</span> <span class="audio" id="c001s0006">With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship.</span> <span class="audio" id="c001s0007">There is nothing surprising in this.</span> <span class="audio" id="c001s0008">If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.</span></p>
`
async function main() {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    debug: true
  })
  let res = await api.sendMessage(msg)
  console.log(res.text)
}

main()