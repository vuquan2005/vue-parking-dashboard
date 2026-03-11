import { minify } from 'html-minifier-terser'
import fs from 'fs'
import zlib from 'zlib'

const html = fs.readFileSync('dist/index.html', 'utf8')

const result = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    useShortDoctype: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
})

fs.writeFileSync('dist/index.minify.html', result)
console.log(`✅ HTML! Size: ${result.length} bytes.`)

const gzipped = zlib.gzipSync(result)
fs.writeFileSync('dist/index.minify.html.gz', gzipped)
console.log(`✅ GZIP! Size: ${gzipped.length} bytes.`)

const hexArray = []
for (let i = 0; i < gzipped.length; i++) {
    hexArray.push(`0x${gzipped[i].toString(16).padStart(2, '0')}`)
}
const chunks = []
for (let i = 0; i < hexArray.length; i += 16) {
    chunks.push(hexArray.slice(i, i + 16).join(', '))
}

const headerContent = `#ifndef HTML_H
#define HTML_H

#include <pgmspace.h>

const uint32_t html_len = ${gzipped.length};
const uint8_t html[] PROGMEM = {
    ${chunks.join(',\n    ')}
};

#endif // HTML_H
`

fs.writeFileSync('dist/index.minify.h', headerContent)
console.log(`✅ Header C (html.h)`)
