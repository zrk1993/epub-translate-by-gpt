import { ChatGPTAPI, ChatMessage } from 'chatgpt';
import * as cheerio from 'cheerio';
import nodeFetch from 'node-fetch';
import ProxyAgent from 'simple-proxy-agent';
import { stdout as log } from 'single-line-log';

export default class GptTranslator {
  private api: ChatGPTAPI;

  constructor () {
    this.api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      fetch: (input: any, init?: any): any => {
        return nodeFetch(input, Object.assign({
          agent: process.env.PROXY ? ProxyAgent(process.env.PROXY) : undefined, 
        }, init))
      }
    });
  }

  async sendGptMessage(prompt: string): Promise<ChatMessage> {
    let i = 0;
    console.log('\r\n\r\n', prompt);
    const res = await this.api.sendMessage(prompt, {
      onProgress: (partialResponse) => {
        log(`翻译中：${i++}%`)
      }
    });
    console.log('\r\n', res.text);
    return res
  }
}