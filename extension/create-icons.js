const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const sizes = [16, 32, 48, 128]

const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7dd3fc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <rect x="${size * 0.2}" y="${size * 0.45}" width="${size * 0.6}" height="${size * 0.4}" rx="${size * 0.08}" fill="none" stroke="white" stroke-width="${size * 0.08}"/>
  <path d="M ${size * 0.35} ${size * 0.45} L ${size * 0.35} ${size * 0.32} A ${size * 0.15} ${size * 0.15} 0 1 1 ${size * 0.65} ${size * 0.32} L ${size * 0.65} ${size * 0.45}" fill="none" stroke="white" stroke-width="${size * 0.08}" stroke-linecap="round"/>
</svg>
`

sizes.forEach(size => {
  const svgContent = createSVGIcon(size)
  const filePath = path.join(iconsDir, `icon${size}.svg`)
  fs.writeFileSync(filePath, svgContent.trim())
  console.log(`Created ${filePath}`)
})

console.log('Icons created successfully!')
console.log('Note: For production, convert SVG files to PNG using a tool like sharp or online converter.')
