import { ChatGPTAPI, ChatMessage } from 'chatgpt';
import nodeFetch from 'node-fetch';
import ProxyAgent from 'simple-proxy-agent';

export default class GptTranslator {
  private api: ChatGPTAPI;
  private limit: number;

  constructor () {
    this.limit = parseInt(process.env.API_LIMITER);
    this.api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      fetch: (input: any, init?: any): any => {
        return nodeFetch(input, Object.assign({
          agent: process.env.PROXY ? ProxyAgent(process.env.PROXY) : undefined, 
        }, init))
      }
    });
  }

  async frequencyCtr() {
    if (this.limit > 0) {
      return this.limit--
    } else {
      return new Promise(r => {
        const timer = setInterval(() => {
          if (this.limit > 0) {
            clearInterval(timer);
            r(this.limit--);
          }
        }, 500);
      })
    }
  }

  async sendGptMessage(prompt: string, onProgress: (partialResponse: ChatMessage) => void): Promise<() => Promise<ChatMessage>> {
    await this.frequencyCtr()
    const res = this.api.sendMessage(prompt, {
      onProgress
    });
    return () => new Promise(r => {
      res.then(v => {
        this.limit++;
        r(v);
      })
    })
    // return this.sendMessageApi(prompt)
  }

 async sendMessageApi(prompt: string): Promise<ChatMessage> {
  const res = await nodeFetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    agent: process.env.PROXY ? ProxyAgent(process.env.PROXY) : undefined,
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ "role": "user", "content": prompt }]
    }),
  })
  const data: any = await res.json();
  const message = data.choices?.[0].message;
  if (message?.content) {
    return { text: message?.content, role: message?.role, id: '' }
  } else {
    console.log(data)
  }
 }
}