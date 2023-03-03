import { ChatGPTAPI, ChatMessage } from 'chatgpt';
import * as cheerio from 'cheerio';
import nodeFetch from 'node-fetch';
import ProxyAgent from 'simple-proxy-agent';

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

  async sendGptMessage(prompt: string, onProgress: (partialResponse: ChatMessage) => void): Promise<ChatMessage> {
    const res = await this.api.sendMessage(prompt, {
      onProgress
    });
    return res
  }
}