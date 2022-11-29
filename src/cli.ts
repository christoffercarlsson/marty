import { Command } from 'commander'
import { archive, backup, remove, restore } from './index.js'
import { readPackageJson } from './utils.js'
const program = new Command()

const pkg = readPackageJson()

program.name(pkg.name).description(pkg.description).version(pkg.version)

program
  .command('archive')
  .description('Create a compressed archive of a given directory')
  .argument('<source>', 'The directory to backup')
  .argument('<destination>', 'The directory in which to store the archive')
  .action(async (source: string, destination: string) => {
    await archive(source, destination)
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
    await backup(source, destination)
  })

program
  .command('remove')
  .alias('clean')
  .alias('clean-up')
  .alias('prune')
  .description('Remove old backups from a given directory')
  .argument('<destination>', 'The path to the backup directory')
  .argument('[days]', 'Backups older than this number of days will be removed')
  .action(async (destination: string, days?: number) => {
    await remove(destination, days)
  })

program
  .command('restore')
  .description('Restore a backup')
  .argument('<backup>', 'The path to the backup directory to restore')
  .argument('<target>', 'The directory in which to store the archive')
  .action(async (backupPath: string, target: string) => {
    await restore(backupPath, target)
  })

program.parse()
