import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { app } from 'electron'
import { join } from 'path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { existsSync, mkdirSync } from 'fs'

let db: ReturnType<typeof drizzle<typeof schema>>

export function getDb() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = join(dbDir, 'gantt.db')
  const sqlite = new Database(dbPath)

  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  // Run migrations
  const migrationsPath = join(__dirname, '../../drizzle')
  if (existsSync(migrationsPath)) {
    migrate(db, { migrationsFolder: migrationsPath })
  }

  return db
}

export { schema }
