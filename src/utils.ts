import { execFile } from 'node:child_process'
import { Dirent, statSync } from 'node:fs'
import {
  readdir as readDirectory,
  rm as removeFileSystemPath
} from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path/posix'
import { promisify } from 'node:util'
import { BACKUP_PATH_RE } from './constants'

export const compareString = (a: string, b: string) =>
  a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base'
  })

export const exec = promisify(execFile)

export const getEntryPath = (destination: string, entry: Dirent) =>
  `${destination}/${entry.name}`

const isDirectory = (path: string) => {
  const stats = statSync(path, { throwIfNoEntry: false })
  return stats ? stats.isDirectory() : false
}

export const ensureDirectory = (path: string) =>
  isDirectory(path)
    ? Promise.resolve(resolvePath(path))
    : Promise.reject(new Error(`Directory not found: ${path}`))

export const findBackupEntries = async (destination: string) => {
  const entries = await readDirectory(destination, { withFileTypes: true })
  return entries
    .filter((entry) => BACKUP_PATH_RE.test(entry.name))
    .sort((a, b) => compareString(a.name, b.name))
    .reverse()
}

export const getTimestamp = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('')
}

export const removePath = (path: string) =>
  removeFileSystemPath(path, { recursive: true, force: true })

export const sync = async (
  source: string,
  destination: string,
  link?: string
) => {
  const defaultOptions = ['-a', '--delete', `${source}/`, destination]
  const options = link
    ? ['--link-dest', link, ...defaultOptions]
    : defaultOptions
  await exec('rsync', options)
}
