import { spawnSync } from 'child_process'

const scripts = [
  'seed:employees',
  'seed:teams',
  'seed:projects',
  'seed:workspace',
  'seed:blog',
  'seed:activity',
] as const

for (const script of scripts) {
  console.log(`\n> Running ${script}\n`)

  const result = spawnSync('npm', ['run', script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('\nAll OrgSphere seed scripts completed successfully.\n')
