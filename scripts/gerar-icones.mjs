/**
 * Gera os PNGs do app a partir do desenho do prumo.
 * Uso: node scripts/gerar-icones.mjs   (precisa de `npm i -D sharp`)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const saida = resolve(raiz, 'public/icones')
mkdirSync(saida, { recursive: true })

const FUNDO = '#10150E'
const LATAO = '#C79A34'

/** O desenho vive num viewBox de 24; aqui ele é posicionado dentro do quadrado. */
function svgIcone(lado, ocupacao, fundo) {
  const escala = (lado * ocupacao) / 19.5
  const deslocX = lado / 2 - 12 * escala
  const deslocY = (lado - 19.5 * escala) / 2 - 2.6 * escala

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  ${fundo ? `<rect width="${lado}" height="${lado}" fill="${fundo}"/>` : ''}
  <g transform="translate(${deslocX} ${deslocY}) scale(${escala})">
    <path d="M7.5 2.6h9" stroke="${LATAO}" stroke-width="1.7" stroke-linecap="round" opacity="0.55"/>
    <path d="M12 2.6v8.1" stroke="${LATAO}" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>
    <path d="M12 10.4 15.9 14.2 12 22.1 8.1 14.2Z" fill="${LATAO}" stroke="${LATAO}" stroke-width="1.1" stroke-linejoin="round"/>
  </g>
</svg>`
}

const arquivos = [
  { nome: 'icone-192.png', lado: 192, ocupacao: 0.62, fundo: FUNDO },
  { nome: 'icone-512.png', lado: 512, ocupacao: 0.62, fundo: FUNDO },
  // maskable: o sistema recorta as bordas, então o desenho fica menor e centrado
  { nome: 'icone-mascara-512.png', lado: 512, ocupacao: 0.44, fundo: FUNDO },
  { nome: 'apple-touch-icon.png', lado: 180, ocupacao: 0.6, fundo: FUNDO },
]

for (const a of arquivos) {
  const svg = svgIcone(a.lado, a.ocupacao, a.fundo)
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  writeFileSync(resolve(saida, a.nome), png)
  console.log(`✓ ${a.nome}  (${a.lado}×${a.lado})`)
}

console.log('\nÍcones gerados em public/icones/')
