import { platform } from 'node:os'
import { format as formatPath, parse as parsePath } from 'node:path/posix'
import backup from './backup'
import { exec, removePath } from './utils'

const getArchivePath = (backupPath: string) => {
  const { dir: destination, name: timestamp } = parsePath(backupPath)
  const { name } = parsePath(destination)
  return formatPath({
    dir: destination,
    name: `${name}-${timestamp}`,
    ext: '.tar.gz'
  })
}

const createArchive = async (backupPath: string) => {
  const archivePath = getArchivePath(backupPath)
  const defaultOptions = ['-C', backupPath, '-czf', archivePath, '.']
  const options =
    platform() === 'darwin'
      ? defaultOptions
      : /* istanbul ignore next */
        ['--hard-dereference', ...defaultOptions]
  await exec('tar', options)
  return archivePath
}

const archive = async (source: string, destination: string) => {
  const backupPath = await backup(source, destination)
  const archivePath = await createArchive(backupPath)
  await removePath(backupPath)
  return archivePath
}

export default archive
