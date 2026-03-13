import { ElectronAPI } from '@electron-toolkit/preload'

export interface Project {
  id: number
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: number
  name: string
  description: string | null
  startDate: string
  endDate: string
  color: string | null
  parentId: number | null
  projectId: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Dependency {
  id: number
  taskId: number
  dependsOnId: number
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
}

export interface FileRecord {
  id: number
  path: string
  name: string
  size: number
  mimeType: string
  projectId: number
  createdAt: string
}

export interface ApiInterface {
  projects: {
    list: () => Promise<Project[]>
    create: (data: { name: string; description?: string; color?: string }) => Promise<Project>
    update: (
      id: number,
      data: Partial<{ name: string; description: string; color: string }>
    ) => Promise<Project>
    delete: (id: number) => Promise<void>
  }
  tasks: {
    list: (projectId: number) => Promise<Task[]>
    create: (data: {
      name: string
      startDate: string
      endDate: string
      projectId: number
      description?: string
      color?: string
      parentId?: number
      sortOrder?: number
    }) => Promise<Task>
    update: (
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
    ) => Promise<Task>
    reorder: (orderedIds: number[]) => Promise<void>
    delete: (id: number) => Promise<void>
  }
  dependencies: {
    list: (taskId: number) => Promise<Dependency[]>
    create: (data: {
      taskId: number
      dependsOnId: number
      type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
    }) => Promise<Dependency>
    delete: (id: number) => Promise<void>
  }
  files: {
    list: (projectId: number) => Promise<FileRecord[]>
    pickAndAdd: (projectId: number) => Promise<FileRecord[]>
    addDropped: (projectId: number, filePaths: string[]) => Promise<FileRecord[]>
    getThumbnail: (filePath: string) => Promise<string | null>
    open: (filePath: string) => Promise<void>
    showInFolder: (filePath: string) => Promise<void>
    delete: (id: number) => Promise<void>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiInterface
  }
}
