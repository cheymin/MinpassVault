const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, 'dist')

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

const filesToCopy = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'background.js'
]

const dirsToCopy = ['icons']

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file)
  const dest = path.join(distDir, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    console.log(`Copied: ${file}`)
  }
})

dirsToCopy.forEach(dir => {
  const srcDir = path.join(__dirname, dir)
  const destDir = path.join(distDir, dir)
  
  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    
    fs.readdirSync(srcDir).forEach(file => {
      const srcFile = path.join(srcDir, file)
      const destFile = path.join(destDir, file)
      fs.copyFileSync(srcFile, destFile)
      console.log(`Copied: ${dir}/${file}`)
    })
  }
})

console.log('\nBuild complete! Output in dist/ folder')
