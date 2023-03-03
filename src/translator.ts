import { ChatGPTAPI } from 'chatgpt';
import * as cheerio from 'cheerio';
import nodeFetch from 'node-fetch';
import ProxyAgent from 'simple-proxy-agent';
import { stdout as log } from 'single-line-log';

export default class GptTranslator {
  private api: ChatGPTAPI;
  private batchPrompt: { id: string, prompt: string, result?: string, resolve?: (v: string) => void }[] = [];

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

  async translator(id: string, prompt: string) {
    const v = { id, prompt, resolve: undefined }
    this.batchPrompt.push(v);
    const promise = new Promise((resolve) => {
      v.resolve = resolve;
    })
    const wariFlag = await this.hand();
    if (wariFlag === true) {
      const p = new Promise((resolve) => {
        v.resolve = resolve;
      })
      return Promise.resolve(() => p)
    } else {
      return promise;
    }
  }

  getResVal(res: any, cb: (v: any) => void) {
    if (typeof res === 'function') {
      res().then(cb)
    } else {
      cb(res)
    }
  }

  async hand() {
    const prompt = this.batchPrompt.map(v => `<p gpt-id="${v.id}">${v.prompt}</p>`).join('');
    if (prompt.length < 300) {
      return true;
    }
    const msg = `将下面的HTML文档中的英文翻译为中文并保留HTML标签\r\n${prompt}`;
    try {
      const res = await this.sendGptMessage(msg);
      const $ = cheerio.load(res.text);
      const prompts = $('p[gpt-id]').toArray();
      for await (const v of prompts) {
        const el = $(v);
        const id = el.attr('gpt-id');
        const p = this.batchPrompt.find(v => v.id === id);
        p.result = el.html();
      }
    } catch (error) {
      console.error(error)
    }
    this.batchPrompt.forEach(v => v.resolve(v.result));
    this.batchPrompt = [];
  }

  private async sendGptMessage(prompt: string) {
    console.log(prompt);
    const res = await this.api.sendMessage(prompt, {
      onProgress: (partialResponse) => {
        log(partialResponse.text)
      }
    });
    return res
  }
}