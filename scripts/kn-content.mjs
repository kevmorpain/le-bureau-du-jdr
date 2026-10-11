// Charge dans une instance (locale ou de production) les jeux de données du livre, rédigés hors du dépôt :
//   SEED_SECRET=… npm run kn:content -- <dossier> <url de base>
// Chaque `<nom>.json` du dossier est envoyé à `/api/admin/ker-nethalas/content/<nom>`.
import { readdir, readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const [directory, baseUrl] = process.argv.slice(2)
const secret = process.env.SEED_SECRET

if (!directory || !baseUrl || !secret) {
  console.error('Usage : SEED_SECRET=… npm run kn:content -- <dossier> <url de base>')
  process.exit(2)
}

const root = baseUrl.replace(/\/$/, '')
const headers = { 'x-seed-secret': secret }
let failures = 0

const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort()
if (!files.length) {
  console.error(`Aucun fichier .json dans ${directory}`)
  process.exit(2)
}

for (const file of files) {
  const name = basename(file, '.json')
  const response = await fetch(`${root}/api/admin/ker-nethalas/content/${name}`, {
    method: 'PUT',
    headers: { ...headers, 'content-type': 'application/json' },
    body: await readFile(join(directory, file)),
  })

  if (response.ok) {
    console.log(`ok       ${name}`)
    continue
  }

  failures++
  const detail = await response.json().catch(() => ({}))
  console.error(`échec ${response.status}  ${name} : ${detail.statusMessage ?? detail.message ?? ''}`)
  for (const issue of Array.isArray(detail.data) ? detail.data : []) console.error(`           ${issue.path || '(racine)'} : ${issue.message}`)
}

const status = await fetch(`${root}/api/admin/ker-nethalas/content`, { headers })
if (status.ok) {
  console.log('\nÉtat des jeux de données :')
  for (const item of await status.json()) console.log(`  ${item.name.padEnd(20)} ${item.loaded ? (item.valid ? 'chargé' : 'chargé mais invalide') : 'absent'}`)
}

process.exitCode = failures ? 1 : 0
