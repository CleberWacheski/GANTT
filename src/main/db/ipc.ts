import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb, schema } from './index'
import { join, basename, extname } from 'path'
import { existsSync, mkdirSync, copyFileSync, statSync, unlinkSync, readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { lookup } from 'mime-types'

function getFilesDir(projectId: number): string {
  const dir = join(app.getPath('userData'), 'files', String(projectId))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function registerDbHandlers() {
  const db = getDb()

  // ── Projects ──────────────────────────────────────────
  ipcMain.handle('db:projects:list', async () => {
    return db.select().from(schema.projects).all()
  })

  ipcMain.handle(
    'db:projects:create',
    async (_, data: { name: string; description?: string; color?: string }) => {
      if (!data.name?.trim()) throw new Error('Nome do projeto é obrigatório')
      return db
        .insert(schema.projects)
        .values({ ...data, name: data.name.trim() })
        .returning()
        .get()
    }
  )

  ipcMain.handle(
    'db:projects:update',
    async (_, id: number, data: Partial<{ name: string; description: string; color: string }>) => {
      if (data.name !== undefined && !data.name.trim())
        throw new Error('Nome do projeto é obrigatório')
      return db
        .update(schema.projects)
        .set({ ...data, name: data.name?.trim(), updatedAt: new Date().toISOString() })
        .where(eq(schema.projects.id, id))
        .returning()
        .get()
    }
  )

  ipcMain.handle('db:projects:delete', async (_, id: number) => {
    return db.delete(schema.projects).where(eq(schema.projects.id, id)).run()
  })

  // ── Tasks ─────────────────────────────────────────────
  ipcMain.handle('db:tasks:list', async (_, projectId: number) => {
    return db.select().from(schema.tasks).where(eq(schema.tasks.projectId, projectId)).all()
  })

  ipcMain.handle(
    'db:tasks:create',
    async (
      _,
      data: {
        name: string
        startDate: string
        endDate: string
        projectId: number
        description?: string
        color?: string
        parentId?: number
        sortOrder?: number
      }
    ) => {
      if (!data.name?.trim()) throw new Error('Nome da tarefa é obrigatório')
      if (!data.startDate) throw new Error('Data de início é obrigatória')
      if (!data.endDate) throw new Error('Data de fim é obrigatória')
      if (data.endDate < data.startDate)
        throw new Error('Data de fim deve ser igual ou após o início')
      return db
        .insert(schema.tasks)
        .values({ ...data, name: data.name.trim() })
        .returning()
        .get()
    }
  )

  ipcMain.handle(
    'db:tasks:update',
    async (
      _,
      id: number,
      data: Partial<{
        name: string
        description: string
        startDate: string
        endDate: string
        color: string
        parentId: number | null
        sortOrder: number
      }>
    ) => {
      if (data.name !== undefined && !data.name.trim())
        throw new Error('Nome da tarefa é obrigatório')
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        throw new Error('Data de fim deve ser igual ou após o início')
      }
      return db
        .update(schema.tasks)
        .set({ ...data, name: data.name?.trim(), updatedAt: new Date().toISOString() })
        .where(eq(schema.tasks.id, id))
        .returning()
        .get()
    }
  )

  ipcMain.handle('db:tasks:reorder', async (_, orderedIds: number[]) => {
    for (let i = 0; i < orderedIds.length; i++) {
      db.update(schema.tasks).set({ sortOrder: i }).where(eq(schema.tasks.id, orderedIds[i])).run()
    }
  })

  ipcMain.handle('db:tasks:delete', async (_, id: number) => {
    return db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run()
  })

  // ── Dependencies ──────────────────────────────────────
  ipcMain.handle('db:dependencies:list', async (_, taskId: number) => {
    return db.select().from(schema.dependencies).where(eq(schema.dependencies.taskId, taskId)).all()
  })

  ipcMain.handle(
    'db:dependencies:create',
    async (
      _,
      data: {
        taskId: number
        dependsOnId: number
        type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
      }
    ) => {
      return db.insert(schema.dependencies).values(data).returning().get()
    }
  )

  ipcMain.handle('db:dependencies:delete', async (_, id: number) => {
    return db.delete(schema.dependencies).where(eq(schema.dependencies.id, id)).run()
  })

  // ── Files ─────────────────────────────────────────────
  ipcMain.handle('db:files:list', async (_, projectId: number) => {
    return db.select().from(schema.files).where(eq(schema.files.projectId, projectId)).all()
  })

  ipcMain.handle('db:files:pick-and-add', async (event, projectId: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Todos os arquivos', extensions: ['*'] },
        { name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] },
        {
          name: 'Documentos',
          extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
        }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return []

    const dir = getFilesDir(projectId)
    const added: (typeof schema.files.$inferSelect)[] = []

    for (const sourcePath of result.filePaths) {
      const originalName = basename(sourcePath)
      const ext = extname(originalName)
      const storedName = `${randomUUID()}${ext}`
      const destPath = join(dir, storedName)

      copyFileSync(sourcePath, destPath)

      const stats = statSync(destPath)
      const mime = lookup(originalName) || 'application/octet-stream'

      const record = db
        .insert(schema.files)
        .values({
          path: destPath,
          name: originalName,
          size: stats.size,
          mimeType: mime,
          projectId
        })
        .returning()
        .get()

      added.push(record)
    }

    return added
  })

  ipcMain.handle('db:files:add-dropped', async (_, projectId: number, filePaths: string[]) => {
    const dir = getFilesDir(projectId)
    const added: (typeof schema.files.$inferSelect)[] = []

    for (const sourcePath of filePaths) {
      if (!existsSync(sourcePath)) continue

      const originalName = basename(sourcePath)
      const ext = extname(originalName)
      const storedName = `${randomUUID()}${ext}`
      const destPath = join(dir, storedName)

      copyFileSync(sourcePath, destPath)

      const stats = statSync(destPath)
      const mime = lookup(originalName) || 'application/octet-stream'

      const record = db
        .insert(schema.files)
        .values({
          path: destPath,
          name: originalName,
          size: stats.size,
          mimeType: mime,
          projectId
        })
        .returning()
        .get()

      added.push(record)
    }

    return added
  })

  ipcMain.handle('db:files:get-thumbnail', async (_, filePath: string) => {
    if (!existsSync(filePath)) return null
    const buffer = readFileSync(filePath)
    return buffer.toString('base64')
  })

  ipcMain.handle('db:files:open', async (_, filePath: string) => {
    if (existsSync(filePath)) {
      shell.openPath(filePath)
    }
  })

  ipcMain.handle('db:files:show-in-folder', async (_, filePath: string) => {
    if (existsSync(filePath)) {
      shell.showItemInFolder(filePath)
    }
  })

  ipcMain.handle('db:files:delete', async (_, id: number) => {
    const file = db.select().from(schema.files).where(eq(schema.files.id, id)).get()
    if (file && existsSync(file.path)) {
      unlinkSync(file.path)
    }
    return db.delete(schema.files).where(eq(schema.files.id, id)).run()
  })
}
