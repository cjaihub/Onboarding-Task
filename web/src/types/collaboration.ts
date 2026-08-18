// Collaboration types for Visual Feedback, Annotations, and Notifications

export interface VisualCapture {
  id: number
  project: number
  work_item?: number | null
  created_by: number
  created_by_name: string
  title: string
  description?: string | null
  original_image: string      // URL to original screenshot
  annotated_image?: string | null // URL to annotated version
  page_url?: string | null
  page_title?: string | null
  browser?: string | null
  viewport_width?: number | null
  viewport_height?: number | null
  capture_type: 'VISIBLE' | 'SELECTED' | 'FULL_PAGE'
  created_at: string
  updated_at: string
  annotations: CaptureAnnotation[]
}

export interface CaptureAnnotation {
  id: number
  capture: number
  type: 'arrow' | 'rect' | 'text' | 'blur'
  coordinates: AnnotationCoordinates
  content?: string | null
  style?: AnnotationStyle | null
  created_by?: number | null
}

export interface AnnotationCoordinates {
  x: number
  y: number
  x2?: number
  y2?: number
  width?: number
  height?: number
}

export interface AnnotationStyle {
  color?: string
  strokeWidth?: number
  fontSize?: number
}

export interface Notification {
  id: number
  actor?: number | null
  actor_name?: string
  recipient: number
  project: number
  capture?: number | null
  work_item?: number | null
  message: string
  read: boolean
  created_at: string
}
