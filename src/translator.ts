import { EventEmitter } from 'events'
import { ChatGPTAPI } from 'chatgpt'
import * as cheerio from 'cheerio';

export default class GptTranslator extends EventEmitter {
  private isWait = false;
  private api: ChatGPTAPI;
  private batchPrompt: { id: string, prompt: string, result?: string, resolve?: (v: string) => void }[] = [];
  constructor () {
    super();
    this.api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      debug: false
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

  async hand() {
    const prompt = this.batchPrompt.map(v => `<p gpt-id="${v.id}">${v.prompt}</p>`).join('');
    if (this.isWait) {
      return true;
    }
    if (prompt.length < 100) {
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
      this.emit('error', error);
    }
    this.batchPrompt.forEach(v => v.resolve(v.result));
    this.batchPrompt = [];
  }

  private async sendGptMessage(prompt: string) {
    // return new Promise<{ text: string }>((resolve) => {
    //   setTimeout(() => {
    //     resolve({ text: prompt });
    //   }, 3000);
    // })
    try {
      this.isWait = true;
      console.log(prompt);
      const res = await this.api.sendMessage(prompt, {
        onProgress: (partialResponse) => {
          console.log(partialResponse.text)
        }
      })
      return res
    } catch (error) {
      throw error
    } finally {
      this.isWait = false;
    }
  }
}