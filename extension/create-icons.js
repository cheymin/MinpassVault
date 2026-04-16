const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const icon16 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUklEQVQ4y2NkYGD4z0ABYGRkZPjPwMDwn5GRkYGBgYHh/38GBgYGBob/DAx0AoxEuphhBABRI/ynRkY2AQAAnQYXNpNlPAAAAABJRU5ErkJggg==', 'base64')
const icon32 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAVklEQVRYw+3VMQoAIAwDUO//oboJOoiI1NTYKBcWFhYn3rtYWFiY/4OBgYGBgYHhPwMDAwMDw38GBoYbYDTSI2cTAQA8jRt0wNl8DQAAAABJRU5ErkJggg==', 'base64')
const icon48 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAXklEQVRoge3OMQEAIAwAsfJ/aMqCgYnEhVnO8O7dBgYGBgYGBob/DAwMDAwMDP8ZGBgYGBgY/jMwMDAwMDD8Z2BgYGBgYPjPwMDAwMDAwPCfgYGBgYGBgfEPJj0WAQNx7FkAAAAASUVORK5CYII=', 'base64')
const icon128 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAhklEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeA24AAABj6UNhgAAAABJRU5ErkJggg==', 'base64')

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), icon16)
fs.writeFileSync(path.join(iconsDir, 'icon32.png'), icon32)
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), icon48)
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), icon128)

console.log('Icons generated!')
