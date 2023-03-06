import * as dotenv from "dotenv";
import EPub from "epub";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import extractZip from "extract-zip";
import * as cheerio from "cheerio";
import { zip as zipFolder } from "zip-a-folder";
import { stdout as log } from "single-line-log";
import Translator from "./translator";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const translator = new Translator();

async function main() {
  const book = path.basename(process.env.BOOK_PATH, '.epub');
  const bookPath = path.resolve(process.env.BOOK_PATH);
  const unzipPath = path.join(__dirname, "../build", book);

  if (!existsSync(bookPath)) {
    console.error("文件不存在，", bookPath);
    return;
  }

  if (process.argv[2] === "-z") {
    await zipFolder(
      unzipPath,
      path.join(path.dirname(bookPath), `${book}_cn.epub`)
    );
    console.log("Translator complete");
    return;
  }

  if (!existsSync(path.join(unzipPath, "META-INF"))) {
    await fs.mkdir(unzipPath, { recursive: true });
    await extractZip(bookPath, { dir: unzipPath });
    console.log("Extraction complete");
  }

  const epub = new EPub(bookPath);
  await new Promise((resolve, reject) => {
    epub.on("end", resolve);
    epub.on("error", reject);
    epub.parse();
  });
  console.log(`解析完成，书名：${epub.metadata?.title}`);

  const step = 1 / epub.flow.length;
  for (let flowIndex = 0; flowIndex < epub.flow.length; flowIndex++) {
    const href: string = epub.flow[flowIndex]["href"];
    const mediaType: string = epub.flow[flowIndex]["media-type"];
    if (!mediaType.includes("tml")) {
      continue;
    }

    console.log("\r\n开始翻译HTML：", href);
    const htmlPath = path.join(unzipPath, ...href.split(/\\\//));
    const html = await fs.readFile(htmlPath, { flag: "r" });
    const $ = cheerio.load(html.toString(), {
      xmlMode: true,
      decodeEntities: false,
    });
    const pEls = $("p").toArray();

    console.log(`文档总段落数：${pEls.length}`);
    for (let index = 0; index < pEls.length; index++) {
      const $el = $(pEls[index]);
      const state: string = $el.attr("k-state");
      if (state === "success" || state === "never") {
        continue;
      }
      const msg = $el.html();
      if (msg.split(/\s+/gi).length < parseInt(process.env.WORD_LEN)) {
        $el.attr("k-state", "never");
        continue;
      }
      const tryTimes = isNaN(parseInt(state)) ? 1 : parseInt(state) + 1;
      $el.attr("k-state", String(tryTimes));
      if (tryTimes > parseInt(process.env.TRY_TIMES)) {
        console.log(`段落翻译失败：`, tryTimes, msg);
        continue;
      }
      let i = 0;
      const onProgress = () => log(`翻译中：${((flowIndex + index / pEls.length) * step * 100).toFixed(2)}%${[".", "..", "..."][i++ % 3]}`);
      onProgress()
      const res = await translator.sendGptMessage(
        `翻译\r\n${msg}`,
        (partialResponse) => onProgress
      );
      if (res?.text) {
        $el.attr("k-state", "success");
        $el.html(res.text);
      } else {
        console.log(`段落翻译失败`, msg);
      }
      await fs.writeFile(htmlPath, $.html(), { flag: "w" });
    }
    console.log("结束翻译HTML：", href);
  }
  await zipFolder(
    unzipPath,
    path.join(path.dirname(bookPath), `${book}_cn.epub`)
  );
  console.log("Translator complete");
}

main();
