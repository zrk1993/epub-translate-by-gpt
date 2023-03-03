import * as dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'

dotenv.config()

async function name2() {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    debug: true
  });

  const res = await api.sendMessage(`将下面的HTML文档中的英文翻译为中文并保留HTML标签
  <p gpt-id="167781379737810000">“<em>Effective TypeScript</em> explores the most common questions we see when working with TypeScript and provides practical, results-oriented advice. Regardless of your level of TypeScript experience, you can learn something from this book.”
  </p>`, {
    onProgress: (partialResponse) => {
      console.log(partialResponse.text)
    }
  })
}

name2()