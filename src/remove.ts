import { Dirent } from 'fs'
import { BACKUP_PATH_RE } from './constants.js'
import {
  compareString,
  ensureDirectory,
  findBackupEntries,
  getEntryPath,
  getTimestamp,
  removePath
} from './utils.js'

const getEntryTimestamp = (entry: Dirent) => {
  const matches = entry.name.match(BACKUP_PATH_RE)
  return matches[1]
}

const entryShouldBeRemoved = (timestamp: string, entry: Dirent) => {
  const entryTimestamp = getEntryTimestamp(entry)
  return compareString(timestamp, entryTimestamp) >= 0
}

const getRemovalTimestamp = (days: number) => {
  const now = new Date().valueOf()
  const date = new Date(now - 1000 * 60 * 60 * 24 * days)
  return getTimestamp(date)
}

const removeEntries = (destination: string, entries: Dirent[]) =>
  Promise.all(
    entries.map(async (entry) => {
      const path = getEntryPath(destination, entry)
      await removePath(path)
      return path
    })
  )

const removeBackups = async (destination: string, days?: number) => {
  const dest = await ensureDirectory(destination)
  const timestamp = getRemovalTimestamp(days || 0)
  const entries = await findBackupEntries(dest)
  return removeEntries(
    dest,
    entries.filter((entry) => entryShouldBeRemoved(timestamp, entry))
  )
}

export default removeBackups
