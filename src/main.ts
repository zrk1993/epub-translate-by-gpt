import * as dotenv from 'dotenv'
import EPub from 'epub'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import extractZip from 'extract-zip'
import * as cheerio from 'cheerio';
import { zip as zipFolder } from 'zip-a-folder';

import generateId from './generate-id'
import Translator from './translator'
import { debounce, delay } from './utils'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const translator = new Translator();

async function main() {
  const book = 'EffectiveTypeScript';
  const bookPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'EffectiveTypeScript.epub');

  const unzipPath = path.join(__dirname, '..', book);

  if (!existsSync(path.join(unzipPath, 'META-INF'))) {
    await fs.mkdir(unzipPath, { recursive: true });
    await extractZip(bookPath, { dir: unzipPath });
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

    console.log('开始翻译HTML：', href);
    const htmlPath = path.join(unzipPath, ...href.split(/\\\//));
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
      await fs.writeFile(htmlPath, $.html())
    }

    console.log(`文档总段落数：${pEls.length}`);
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
        console.log(`段落${id}翻译失败：`, tryTimes, msg);
        continue;
      }
      const res: any = await translator.translator(id, msg);
      translator.getResVal(res, (v) => {
        if (v) {
          $el.attr('k-state', 'success');
          $el.html(v);
        } else {
          console.log(`段落${id}翻译失败`, id, msg);
        }
      });
      await fs.writeFile(htmlPath, $.html(), { flag: 'w' });
    }
    await delay(300);
    console.log('结束翻译HTML：', href);
  }
  await zipFolder(unzipPath, path.join(path.dirname(bookPath), `${book}_cn.epub`));
  console.log('Translator complete');
}

main()