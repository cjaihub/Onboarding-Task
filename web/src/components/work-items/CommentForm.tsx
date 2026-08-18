"use client"
import * as React from "react"
import { useCreateCommentMutation } from "../../hooks/mutations"
import { Button } from "../ui/Button"
import { Spinner } from "../ui/Spinner"
import { FeedbackBanner } from "../ui/FeedbackBanner"
import { Image as ImageIcon, X, Paperclip, Send, Camera, File as FileIcon } from "lucide-react"
import Image from "next/image"

export function CommentForm({ workItemId, onTriggerVisualFeedback }: { workItemId: number, onTriggerVisualFeedback?: () => void }) {
  const [message, setMessage] = React.useState("")
  const [attachment, setAttachment] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const mutation = useCreateCommentMutation()

  const [showAttachMenu, setShowAttachMenu] = React.useState(false)

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setAttachment(null)
      setPreviewUrl(null)
      return
    }
    setAttachment(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null) // Not an image, no preview
    }
    setErrorMsg(null)
    setShowAttachMenu(false)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) handleFileChange(file)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed && !attachment) return

    setErrorMsg(null)
    try {
      await mutation.mutateAsync({ id: workItemId, message: trimmed, attachment: attachment || undefined })
      setMessage("")
      setAttachment(null)
      setPreviewUrl(null)
      textareaRef.current?.focus()
    } catch (err) {
      const msg = (err as { message?: string })?.message || "Failed to post comment. Please try again."
      setErrorMsg(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative z-20" aria-label="Add comment">
      {errorMsg && (
        <FeedbackBanner
          type="error"
          message={errorMsg}
          onDismiss={() => setErrorMsg(null)}
        />
      )}

      {/* Preview Area */}
      {attachment && (
        <div className="relative inline-block w-fit mb-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {previewUrl ? (
            <div className="relative h-32 w-32">
              <Image src={previewUrl} alt="Attachment preview" fill className="object-cover rounded border shadow-sm" unoptimized />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2">
              <FileIcon className="h-6 w-6 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => handleFileChange(null)}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md z-10"
            aria-label="Remove attachment"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-[#1e2128] rounded-xl p-2 border border-gray-800 focus-within:border-red-500 transition-colors shadow-sm">
        
        {/* Attachment Menu */}
        <div className="relative mb-1">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-xl border border-gray-800 bg-[#0f1115] overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
              >
                <FileIcon className="h-4 w-4" /> Upload File
              </button>
              {onTriggerVisualFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    onTriggerVisualFeedback();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                >
                  <Camera className="h-4 w-4" /> Visual Feedback
                </button>
              )}
            </div>
          )}
        </div>

        <textarea
          id="comment-message"
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => {
             setMessage(e.target.value)
             // Auto-resize
             e.target.style.height = 'auto'
             e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onPaste={handlePaste}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-none text-sm font-medium text-white placeholder-gray-500 focus:ring-0 resize-none max-h-[120px] py-2.5 px-2"
          style={{ minHeight: '44px' }}
        />
        
        <div className="mb-1">
          <button
            type="submit"
            disabled={mutation.isPending || (!message.trim() && !attachment)}
            className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all disabled:opacity-40 disabled:hover:bg-red-600 shadow-md flex-shrink-0 flex items-center justify-center"
            aria-label="Send message"
          >
            {mutation.isPending ? <Spinner size="sm" className="border-white/40 border-t-white" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </form>
  )
}
