import * as dotenv from 'dotenv'
import EPub from 'epub'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import extractZip from 'extract-zip'
import * as cheerio from 'cheerio';

import generateId from './generate-id'
import Translator from './translator'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const translator = new Translator();

async function main() {
  const book = 'EffectiveTypeScript';
  const bookPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'EffectiveTypeScript.epub');

  const unzipEnPath = path.join(__dirname, '..', book, 'en');
  const unzipCnPath = path.join(__dirname, '..', book, 'cn');

  if (!existsSync(path.join(unzipEnPath, 'META-INF'))) {
    await fs.mkdir(unzipEnPath, { recursive: true });
    await fs.mkdir(unzipCnPath, { recursive: true });
    await extractZip(bookPath, { dir: unzipEnPath });
    await extractZip(bookPath, { dir: unzipCnPath });
    console.log('Extraction complete');
  }

  const epub = new EPub(bookPath);
  await new Promise((resolve, reject) => {
    epub.on('end', resolve);
    epub.on('error', reject);
    epub.parse();
  })
  console.log(`解析完成，书名：${epub.metadata?.title}`);

  for (let index = 0; index < epub.flow.length; index++) {
    const href: string = epub.flow[index]['href'];
    const mediaType: string = epub.flow[index]['media-type'];
    if (!mediaType.includes('tml')) {
      continue;
    }
    const stateInfoPath = path.join(unzipEnPath, 'state_info.txt');
    if (!existsSync(stateInfoPath)) {
      await fs.writeFile(stateInfoPath, '')
    }
    const stateInfoFs = await fs.readFile(stateInfoPath);
    const stateInfo = stateInfoFs.toString();
    // console.log('历史状态信息：', stateInfo);
    if (stateInfo.includes(href)) {
      continue;
    }
    console.log('翻译：', href);
    const htmlPath = path.join(unzipCnPath, ...href.split(/\\\//));
    const html = await fs.readFile(htmlPath, { flag: 'r' });
    const $ = cheerio.load(html);
    const pEls = $('p').toArray();

    let shouldWriteId = false;
    for (let index = 0; index < pEls.length; index++) {
      const $el = $(pEls[index]);
      if (!$el.attr('k-id')) {
        $el.attr('k-id', generateId());
        shouldWriteId = true
      }
    }
    if (shouldWriteId) {
      console.log('对文档的段落进行标记')
      await fs.writeFile(htmlPath, $.html())
    }

    for (let index = 0; index < pEls.length; index++) {
      const $el = $(pEls[index]);
      const id = $el.attr('k-id');
      const state: string = $el.attr('k-state');
      if (state === 'success') {
        continue;
      }
      const tryTimes = isNaN(parseInt(state)) ? 1 : parseInt(state) + 1;
      $el.attr('k-state', String(tryTimes));
      const msg = $el.html();
      if (tryTimes > 2) {
        console.log('翻译失败：', tryTimes, msg);
        continue;
      }
      const res: any = await translator.translator(id, msg);
      if (typeof res === 'function') {
        res().then((v: string) => {
          $el.attr('k-state', 'success');
          $el.html(v);
        })
      } else {
        $el.attr('k-state', 'success');
        $el.html(res);
      }
    }

    await fs.writeFile(htmlPath, $.html(), { flag: 'w' })

    // await fs.appendFile(stateInfoPath, '\r\n' + href);
  }
}

main()