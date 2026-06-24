'use client'

import { useRef, useState, useCallback, type ChangeEvent, type FormEvent, type KeyboardEvent, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react'
import type { FileUIPart } from 'ai'

interface MultimodalInputProps {
  onSend: (text: string, fileParts: FileUIPart[]) => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
const TEXT_TYPES = ['text/plain', 'text/csv', 'application/json', '.env', 'text/markdown', 'text/x-shellscript', 'text/x-python', 'text/javascript', 'text/typescript']

export function MultimodalInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Scrivi un messaggio... (Invio per inviare)',
}: MultimodalInputProps) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextareaInput = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }, [])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && files.length === 0) || isLoading || disabled) return
    let textToSend = text
    const fileParts: FileUIPart[] = []

    for (const file of files) {
      if (IMAGE_TYPES.includes(file.type)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        fileParts.push({ type: 'file', mediaType: file.type, filename: file.name, url: dataUrl })
      } else {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsText(file)
        })
        const fileHeader = `--- Contenuto di "${file.name}" ---\n`
        textToSend = textToSend
          ? `${textToSend}\n\n${fileHeader}${content}\n--- Fine "${file.name}" ---`
          : `${fileHeader}${content}\n--- Fine "${file.name}" ---`
      }
    }

    setText('')
    setFiles([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(textToSend, fileParts)
  }, [text, files, disabled, isLoading, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }, [handleSubmit])

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      IMAGE_TYPES.includes(f.type) || f.type.startsWith('text/') || f.name.endsWith('.md')
    )
    if (dropped.length > 0) setFiles(prev => [...prev, ...dropped])
  }, [])

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex gap-3 items-end transition-all ${isDragOver ? 'scale-[1.01]' : ''}`}
    >
      {isDragOver && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-sm text-primary font-medium">Rilascia i file qui</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 right-0 flex gap-2 flex-wrap">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative group">
              {file.type.startsWith('image/') ? (
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-border/50 bg-muted">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border border-border/50 bg-muted flex flex-col items-center justify-center gap-1 p-1">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">{file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={[...IMAGE_TYPES, 'text/plain', 'text/csv', '.md', 'application/json'].join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextareaInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className="flex-1 rounded-xl border border-input bg-muted/40 px-4 py-3 pl-11 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[44px] max-h-[200px] disabled:opacity-50"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isLoading}
        className="absolute left-3 bottom-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      <Button
        type="submit"
        size="icon"
        className="h-11 w-11 rounded-xl flex-shrink-0"
        disabled={(!text.trim() && files.length === 0) || isLoading || disabled}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  )
}
