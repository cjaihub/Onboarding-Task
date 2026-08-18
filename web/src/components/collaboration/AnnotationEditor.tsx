"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { CaptureAnnotation, AnnotationCoordinates, AnnotationStyle } from '../../types/collaboration'
import { Square, ArrowRight, Type, Minus, Trash2, Save, Undo, ZoomIn, ZoomOut } from 'lucide-react'

type Tool = 'select' | 'arrow' | 'rect' | 'text'

interface DrawingAnnotation {
  id: string // temporary client-side id
  type: Tool
  coordinates: AnnotationCoordinates
  content?: string
  style: AnnotationStyle
}

interface AnnotationEditorProps {
  imageUrl: string
  existingAnnotations?: CaptureAnnotation[]
  onSave: (dataUrl: string, annotations: DrawingAnnotation[]) => void
  onClose: () => void
}

const DEFAULT_COLOR = '#ef4444'
const DEFAULT_STROKE = 3

export function AnnotationEditor({ imageUrl, existingAnnotations = [], onSave, onClose }: AnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeTool, setActiveTool] = useState<Tool>('rect')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE)
  const [annotations, setAnnotations] = useState<DrawingAnnotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [scale, setScale] = useState(1)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  // Load image and set canvas dimensions
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      redraw(img, [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  const redraw = useCallback((img?: HTMLImageElement, anns?: DrawingAnnotation[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sourceImg = img || imgRef.current
    const sourceAnns = anns !== undefined ? anns : annotations

    if (!sourceImg) return

    // Set canvas to image natural size
    canvas.width = sourceImg.naturalWidth
    canvas.height = sourceImg.naturalHeight

    ctx.drawImage(sourceImg, 0, 0)

    sourceAnns.forEach(ann => drawAnnotation(ctx, ann))
  }, [annotations])

  // Redraw whenever annotations change
  useEffect(() => {
    if (imgRef.current) redraw(imgRef.current, annotations)
  }, [annotations, redraw])

  function drawAnnotation(ctx: CanvasRenderingContext2D, ann: DrawingAnnotation) {
    ctx.save()
    ctx.strokeStyle = ann.style.color || DEFAULT_COLOR
    ctx.fillStyle = ann.style.color || DEFAULT_COLOR
    ctx.lineWidth = ann.style.strokeWidth || DEFAULT_STROKE
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const { x, y, x2 = x, y2 = y, width = 0, height = 0 } = ann.coordinates

    switch (ann.type) {
      case 'rect':
        ctx.strokeRect(x, y, x2 - x, y2 - y)
        ctx.fillStyle = `${ann.style.color || DEFAULT_COLOR}20`
        ctx.fillRect(x, y, x2 - x, y2 - y)
        break

      case 'arrow': {
        const headLen = 16
        const angle = Math.atan2(y2 - y, x2 - x)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
        break
      }

      case 'text':
        if (ann.content) {
          ctx.font = `bold ${ann.style.fontSize || 18}px -apple-system, BlinkMacSystemFont, sans-serif`
          ctx.fillStyle = '#000000'
          ctx.fillText(ann.content, x + 2, y + 2)
          ctx.fillStyle = ann.style.color || DEFAULT_COLOR
          ctx.fillText(ann.content, x, y)
        }
        break
    }

    ctx.restore()
  }

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (activeTool === 'text') {
      const pt = getCanvasPoint(e)
      setTextInput(pt)
      setTextValue('')
      return
    }
    setIsDrawing(true)
    setStartPoint(getCanvasPoint(e))
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !startPoint) return
    const pt = getCanvasPoint(e)
    // Live preview: redraw existing + current ghost annotation
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current) return
    const ctx = canvas.getContext('2d')!
    // Redraw base
    ctx.drawImage(imgRef.current, 0, 0)
    annotations.forEach(ann => drawAnnotation(ctx, ann))
    // Draw ghost
    const ghost: DrawingAnnotation = {
      id: '_ghost',
      type: activeTool,
      coordinates: { x: startPoint.x, y: startPoint.y, x2: pt.x, y2: pt.y },
      style: { color, strokeWidth },
    }
    drawAnnotation(ctx, ghost)
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !startPoint) return
    setIsDrawing(false)
    const pt = getCanvasPoint(e)
    // Skip tiny accidental clicks
    if (Math.abs(pt.x - startPoint.x) < 5 && Math.abs(pt.y - startPoint.y) < 5) {
      setStartPoint(null)
      return
    }
    const newAnn: DrawingAnnotation = {
      id: `${Date.now()}`,
      type: activeTool,
      coordinates: { x: startPoint.x, y: startPoint.y, x2: pt.x, y2: pt.y },
      style: { color, strokeWidth },
    }
    setAnnotations(prev => [...prev, newAnn])
    setStartPoint(null)
  }

  function commitTextAnnotation() {
    if (!textInput || !textValue.trim()) {
      setTextInput(null)
      return
    }
    setAnnotations(prev => [...prev, {
      id: `${Date.now()}`,
      type: 'text',
      coordinates: { x: textInput.x, y: textInput.y },
      content: textValue,
      style: { color, fontSize: 18 },
    }])
    setTextInput(null)
    setTextValue('')
  }

  function undo() {
    setAnnotations(prev => prev.slice(0, -1))
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/png'), annotations)
  }

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#000000']

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'rect', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
    { id: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Arrow' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--surface-base)' }}>
      {/* Top Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Tools */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--surface-raised)' }}>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: activeTool === tool.id ? 'var(--brand)' : 'transparent',
                color: activeTool === tool.id ? '#fff' : 'var(--text-muted)',
              }}
            >
              {tool.icon}
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Color palette */}
        <div className="flex items-center gap-1.5">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-5 w-5 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                border: color === c ? '2px solid var(--text-primary)' : '1px solid transparent',
                outline: color === c ? '2px solid var(--brand)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-2">
          <Minus className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          <input
            type="range" min={1} max={12} value={strokeWidth}
            onChange={e => setStrokeWidth(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{strokeWidth}px</span>
        </div>

        <div className="flex-1" />

        {/* Undo */}
        <button
          onClick={undo}
          disabled={annotations.length === 0}
          title="Undo"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)' }}
        >
          <Undo className="h-4 w-4" />
        </button>

        {/* Delete all */}
        <button
          onClick={() => setAnnotations([])}
          disabled={annotations.length === 0}
          title="Clear all"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 hover:text-red-500"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)' }}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-bold text-white transition-colors"
          style={{ background: 'var(--brand)' }}
        >
          <Save className="h-4 w-4" />
          Save Annotation
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ background: '#111' }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              maxWidth: '100%',
              cursor: activeTool === 'text' ? 'text' : 'crosshair',
              display: 'block',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
            }}
          />
          {/* Text input overlay */}
          {textInput && (
            <input
              autoFocus
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitTextAnnotation()
                if (e.key === 'Escape') setTextInput(null)
              }}
              onBlur={commitTextAnnotation}
              style={{
                position: 'absolute',
                left: `${(textInput.x / imgSize.w) * 100}%`,
                top: `${(textInput.y / imgSize.h) * 100}%`,
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color,
                border: `2px solid ${color}`,
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '14px',
                fontWeight: 700,
                outline: 'none',
                zIndex: 100,
              }}
              placeholder="Type text..."
            />
          )}
        </div>
      </div>

      {/* Bottom status */}
      <div
        className="flex items-center justify-between px-4 py-2 text-xs border-t flex-shrink-0"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span>
        <span>{imgSize.w} × {imgSize.h}px</span>
      </div>
    </div>
  )
}
