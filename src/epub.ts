import EPub from 'epub'
import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio';

const bookPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'EffectiveTypeScript.epub')

var epub = new EPub(bookPath);

epub.on("error", function(err){
    console.log("ERROR\n-----");
    throw err;
});

epub.on("end", (err) => {
    console.log("METADATA:\n");
    console.log(epub.metadata);

    console.log("\nTOC:\n");
    console.log(epub.toc);

    (epub as any).zip.readFile('OEBPS/ch02.html', (err: Error, buffer: Buffer) => {
        if (err) throw err;
        const html = buffer.toString()
        const $ = cheerio.load(html);

        $('p').toArray().forEach(v => {
            console.log("---------")
            console.log($(v).html())
        })
    });
});

epub.parse();