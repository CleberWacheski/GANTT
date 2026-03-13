import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { cn } from '@renderer/lib/utils'
import {
  ExternalLink,
  Eye,
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderOpen,
  MoreVertical,
  Plus,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import type { FileRecord } from '../../../preload/index.d'

interface FilesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number
  projectName: string
  projectColor: string
}

function isImage(mime: string) {
  return mime.startsWith('image/')
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return FileImage
  if (mime.startsWith('video/')) return FileVideo
  if (mime.startsWith('audio/')) return FileAudio
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return FileSpreadsheet
  if (
    mime.includes('text') ||
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('word')
  )
    return FileText
  return File
}

export const FilesPanel: FC<FilesPanelProps> = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectColor
}) => {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const loadFiles = useCallback(async () => {
    if (!projectId) return
    const list = await window.api.files.list(projectId)
    setFiles(list)

    // Load thumbnails for images
    const thumbs: Record<number, string> = {}
    await Promise.all(
      list
        .filter((f) => isImage(f.mimeType))
        .map(async (f) => {
          const b64 = await window.api.files.getThumbnail(f.path)
          if (b64) thumbs[f.id] = `data:${f.mimeType};base64,${b64}`
        })
    )
    setThumbnails(thumbs)
  }, [projectId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async IPC data fetching
    if (open) loadFiles()
  }, [open, loadFiles])

  const handlePickFiles = async () => {
    await window.api.files.pickAndAdd(projectId)
    loadFiles()
  }

  const handleDelete = async (id: number) => {
    await window.api.files.delete(id)
    loadFiles()
  }

  const handleOpen = (path: string) => {
    window.api.files.open(path)
  }

  const handleShowInFolder = (path: string) => {
    window.api.files.showInFolder(path)
  }

  const handlePreview = async (file: FileRecord) => {
    if (isImage(file.mimeType)) {
      const b64 = await window.api.files.getThumbnail(file.path)
      if (b64) {
        setPreviewSrc(`data:${file.mimeType};base64,${b64}`)
        setPreviewFile(file)
      }
    }
  }

  // Drop zone handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = dropRef.current?.getBoundingClientRect()
    if (rect) {
      const { clientX, clientY } = e
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragOver(false)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length === 0) return

    const paths: string[] = []
    for (let i = 0; i < droppedFiles.length; i++) {
      const f = droppedFiles[i]
      //@ts-ignore -- File.path is not defined in the type definition, but it is available at runtime
      if (f.path) paths.push(f.path)
    }

    if (paths.length > 0) {
      await window.api.files.addDropped(projectId, paths)
      loadFiles()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: projectColor }} />
              <DialogTitle>Arquivos — {projectName}</DialogTitle>
            </div>
          </DialogHeader>

          <div
            ref={dropRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="space-y-3"
          >
            {/* Drop zone / Add button */}
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <Upload
                className={cn('h-8 w-8 mb-2', isDragOver ? 'text-blue-500' : 'text-slate-300')}
              />
              <p className="text-sm text-slate-500 mb-2">Arraste arquivos aqui ou</p>
              <Button size="sm" variant="outline" onClick={handlePickFiles}>
                <Plus className="h-3.5 w-3.5" />
                Escolher arquivos
              </Button>
            </div>

            {/* Files list */}
            {files.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-slate-300">
                <FolderOpen className="h-6 w-6 mb-1" />
                <span className="text-xs">Nenhum arquivo</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {files.map((file) => {
                  const Icon = getFileIcon(file.mimeType)
                  const hasThumb = isImage(file.mimeType) && thumbnails[file.id]

                  return (
                    <div
                      key={file.id}
                      className="group relative flex flex-col rounded-lg border border-slate-100 bg-white overflow-hidden hover:border-slate-200 hover:shadow-sm transition-all"
                    >
                      {/* Preview area */}
                      <div
                        className="relative h-28 flex items-center justify-center bg-slate-50 cursor-pointer"
                        onClick={() =>
                          isImage(file.mimeType) ? handlePreview(file) : handleOpen(file.path)
                        }
                      >
                        {hasThumb ? (
                          <img
                            src={thumbnails[file.id]}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Icon className="h-10 w-10 text-slate-300" />
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {isImage(file.mimeType) ? (
                              <Eye className="h-5 w-5 text-white drop-shadow-md" />
                            ) : (
                              <ExternalLink className="h-5 w-5 text-white drop-shadow-md" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex items-center gap-1.5 px-2 py-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{formatSize(file.size)}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpen(file.path)}>
                              <ExternalLink className="h-3.5 w-3.5" />
                              Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowInFolder(file.path)}>
                              <FolderOpen className="h-3.5 w-3.5" />
                              Mostrar na pasta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => handleDelete(file.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview modal */}
      {previewFile && previewSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setPreviewFile(null)
            setPreviewSrc(null)
          }}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => {
              setPreviewFile(null)
              setPreviewSrc(null)
            }}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewSrc}
              alt={previewFile.name}
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
            />
            <p className="text-sm text-white/80">{previewFile.name}</p>
          </div>
        </div>
      )}
    </>
  )
}
