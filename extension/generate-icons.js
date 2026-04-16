const fs = require('fs')
const path = require('path')

const iconSizes = [16, 32, 48, 128]
const iconsDir = path.join(__dirname, 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

function generatePNG(size) {
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52,
    (size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF,
    (size >> 24) & 0xFF, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF,
    0x08, 0x02,
    0x00, 0x00, 0x00
  ])
  
  const pixels = []
  for (let y = 0; y < size; y++) {
    pixels.push(0)
    for (let x = 0; x < size; x++) {
      const cx = size / 2
      const cy = size / 2
      const r = size * 0.4
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      
      if (dist < r) {
        const t = dist / r
        const r1 = Math.round(99 + (139 - 99) * t)
        const g1 = Math.round(102 + (92 - 102) * t)
        const b1 = Math.round(241 + (246 - 241) * t)
        pixels.push(r1, g1, b1, 255)
      } else {
        pixels.push(0, 0, 0, 0)
      }
    }
  }
  
  const zlib = require('zlib')
  const compressed = zlib.deflateSync(Buffer.from(pixels))
  
  const idatLength = compressed.length
  const idatHeader = Buffer.from([
    (idatLength >> 24) & 0xFF,
    (idatLength >> 16) & 0xFF,
    (idatLength >> 8) & 0xFF,
    idatLength & 0xFF,
    0x49, 0x44, 0x41, 0x54
  ])
  
  const crc = require('zlib').crc32 || ((data) => 0)
  
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82])
  
  return Buffer.concat([header, idatHeader, compressed, iend])
}

iconSizes.forEach(size => {
  const filename = path.join(iconsDir, `icon${size}.png`)
  const pngData = generatePNG(size)
  fs.writeFileSync(filename, pngData)
  console.log(`Generated: icon${size}.png`)
})

console.log('All icons generated!')
