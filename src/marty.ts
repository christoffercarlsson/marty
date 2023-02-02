import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path/posix'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { archive, backup, remove, restore } from './index'

const readPackageJson = () => {
  const path = resolvePath(
    fileURLToPath(import.meta.url),
    '../../../package.json'
  )
  const json = readFileSync(path, { encoding: 'utf-8' })
  return JSON.parse(json) as {
    name: string
    description: string
    version: string
  }
}

const { name, description, version } = readPackageJson()

const program = new Command()

program.name(name).description(description).version(version)

program
  .command('archive')
  .description('Create a compressed archive of a given directory')
  .argument('<source>', 'The directory to backup')
  .argument('<destination>', 'The directory in which to store the archive')
  .action(async (source: string, destination: string) => {
    const archivePath = await archive(source, destination)
    console.log(archivePath)
  })

program
  .command('backup')
  .description('Create a backup of a given directory')
  .argument('<source>', 'The directory to backup')
  .argument(
    '<destination>',
    'The directory in which to store the backed up files'
  )
  .action(async (source: string, destination: string) => {
    const backupPath = await backup(source, destination)
    console.log(backupPath)
  })

program
  .command('remove')
  .alias('clean')
  .alias('clean-up')
  .alias('prune')
  .description('Remove old backups from a given directory')
  .argument('<destination>', 'The path to the backup directory')
  .argument('[days]', 'Backups older than this number of days will be removed')
  .action(async (destination: string, days: number) => {
    const removed = await remove(destination, days)
    console.log(`${removed.join('\n')}`)
  })

program
  .command('restore')
  .description('Restore a backup')
  .argument('<backup>', 'The path to the backup directory to restore')
  .argument('<target>', 'The directory to restore the backup to')
  .action(restore)

program.parse()
