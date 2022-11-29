import { ensureDirectory, sync } from './utils.js'

const restoreBackup = async (backupPath: string, target: string) =>
  sync(await ensureDirectory(backupPath), await ensureDirectory(target))

export default restoreBackup
