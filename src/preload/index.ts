import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  projects: {
    list: () => ipcRenderer.invoke('db:projects:list'),
    create: (data: { name: string; description?: string; color?: string }) =>
      ipcRenderer.invoke('db:projects:create', data),
    update: (id: number, data: Partial<{ name: string; description: string; color: string }>) =>
      ipcRenderer.invoke('db:projects:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('db:projects:delete', id)
  },
  tasks: {
    list: (projectId: number) => ipcRenderer.invoke('db:tasks:list', projectId),
    create: (data: {
      name: string
      startDate: string
      endDate: string
      projectId: number
      description?: string
      color?: string
      parentId?: number
      sortOrder?: number
    }) => ipcRenderer.invoke('db:tasks:create', data),
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
    ) => ipcRenderer.invoke('db:tasks:update', id, data),
    reorder: (orderedIds: number[]) => ipcRenderer.invoke('db:tasks:reorder', orderedIds),
    delete: (id: number) => ipcRenderer.invoke('db:tasks:delete', id)
  },
  dependencies: {
    list: (taskId: number) => ipcRenderer.invoke('db:dependencies:list', taskId),
    create: (data: {
      taskId: number
      dependsOnId: number
      type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
    }) => ipcRenderer.invoke('db:dependencies:create', data),
    delete: (id: number) => ipcRenderer.invoke('db:dependencies:delete', id)
  },
  files: {
    list: (projectId: number) => ipcRenderer.invoke('db:files:list', projectId),
    pickAndAdd: (projectId: number) => ipcRenderer.invoke('db:files:pick-and-add', projectId),
    addDropped: (projectId: number, filePaths: string[]) =>
      ipcRenderer.invoke('db:files:add-dropped', projectId, filePaths),
    getThumbnail: (filePath: string) => ipcRenderer.invoke('db:files:get-thumbnail', filePath),
    open: (filePath: string) => ipcRenderer.invoke('db:files:open', filePath),
    showInFolder: (filePath: string) => ipcRenderer.invoke('db:files:show-in-folder', filePath),
    delete: (id: number) => ipcRenderer.invoke('db:files:delete', id)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
