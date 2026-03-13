import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#3b82f6'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  color: text('color'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: integer('parent_id').references((): any => tasks.id, { onDelete: 'cascade' }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
})

export const dependencies = sqliteTable('dependencies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  dependsOnId: integer('depends_on_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']
  })
    .notNull()
    .default('finish_to_start')
})

export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(),
  name: text('name').notNull(),
  size: integer('size').notNull().default(0),
  mimeType: text('mime_type').notNull().default('application/octet-stream'),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
})
