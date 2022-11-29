import { mkdir as createDirectory } from 'node:fs/promises'
import {
  ensureDirectory,
  findBackupEntries,
  getEntryPath,
  getTimestamp,
  sync
} from './utils.js'

const findBackups = async (destination: string) => {
  const entries = await findBackupEntries(destination)
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => getEntryPath(destination, entry))
}

const findLatestBackup = async (destination: string) => {
  const backups = await findBackups(destination)
  return backups[0]
}

const backup = async (source: string, destination: string) => {
  const backupPath = `${await ensureDirectory(destination)}/${getTimestamp(
    new Date()
  )}`
  const link = await findLatestBackup(destination)
  await createDirectory(backupPath)
  await sync(await ensureDirectory(source), backupPath, link)
  return backupPath
}

export default backup
