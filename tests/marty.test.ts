import { access, constants } from 'node:fs'
import {
  mkdir as createDirectory,
  mkdtemp as createTempDirectory,
  readFile as readFilePath,
  rm as removeFileSystemPath,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join as joinPath } from 'path/posix'
import { archive, backup, remove, restore } from '../src'

const BACKUP_PATH_RE = /([0-9]{14})(\.tar\.gz)?$/

const pathExists = (path: string) =>
  new Promise((resolve) => {
    access(path, constants.F_OK, (error) => {
      resolve(!error)
    })
  })

const readFile = (path: string) => readFilePath(path, { encoding: 'utf-8' })

const removePath = (path: string) =>
  removeFileSystemPath(path, { recursive: true, force: true })

const sleep = (seconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })

describe('marty', () => {
  let tempDir: string
  let source: string
  let destination: string
  let greetingFile: string
  const greeting = 'Hello World!\n'

  beforeEach(async () => {
    tempDir = await createTempDirectory(joinPath(tmpdir(), 'marty-'))
    source = `${tempDir}/source`
    destination = `${tempDir}/backups`
    greetingFile = `hello.txt`
    await createDirectory(source)
    await createDirectory(destination)
    await writeFile(`${source}/${greetingFile}`, greeting)
  })

  it('should create a compressed archive of a given directory', async () => {
    const archivePath = await archive(source, destination)
    expect(archivePath).toMatch(BACKUP_PATH_RE)
    await expect(pathExists(archivePath)).resolves.toBe(true)
  })

  it('should create a backup of a given directory', async () => {
    const backupPath = await backup(source, destination)
    expect(backupPath).toMatch(BACKUP_PATH_RE)
    const greetingPath = `${backupPath}/${greetingFile}`
    await expect(pathExists(greetingPath)).resolves.toBe(true)
    await expect(readFile(greetingPath)).resolves.toEqual(greeting)
  })

  it('should restore a backup to a given directory', async () => {
    const backupPath = await backup(source, destination)
    await removePath(source)
    await createDirectory(source)
    await restore(backupPath, source)
    const greetingPath = `${source}/${greetingFile}`
    await expect(pathExists(greetingPath)).resolves.toBe(true)
    await expect(readFile(greetingPath)).resolves.toEqual(greeting)
  })

  it('should remove old backups from a given directory', async () => {
    const firstBackup = await backup(source, destination)
    await sleep(1)
    const secondBackup = await backup(source, destination)
    await expect(pathExists(firstBackup)).resolves.toBe(true)
    await expect(pathExists(secondBackup)).resolves.toBe(true)
    const removedBackups = await remove(destination)
    expect(removedBackups).toContain(firstBackup)
    expect(removedBackups).toContain(secondBackup)
    await expect(pathExists(firstBackup)).resolves.toBe(false)
    await expect(pathExists(secondBackup)).resolves.toBe(false)
  })

  it('should throw an exception when trying to create backup of a non-existing source', async () => {
    await removePath(source)
    await expect(backup(source, destination)).rejects.toThrow(
      `Directory not found: ${source}`
    )
  })

  it('should throw an exception when trying to backup to a non-existing destination', async () => {
    await removePath(destination)
    await expect(backup(source, destination)).rejects.toThrow(
      `Directory not found: ${destination}`
    )
  })

  afterEach(async () => {
    await removePath(tempDir)
  })
})
