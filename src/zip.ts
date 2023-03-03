import path from 'path'
import { fileURLToPath } from 'url'

const bookPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'Flipped.epub')

import extractZip from 'extract-zip'

import { zip } from 'zip-a-folder';

async function extract () {
  try {
    await extractZip(bookPath, {
      dir: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'Flipped')
    })
    console.log('Extraction complete')
  } catch (err) {
    // handle any errors
  }
}

async function zipFolder() {
  await zip(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'Flipped'),
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'Flipped2.epub'));
  console.log('zip complete')
}

zipFolder()
