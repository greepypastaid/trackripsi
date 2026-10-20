export type ChapterStatus = 'not_started' | 'in_progress' | 'revision' | 'completed'
export type ResearchStatus = 'active' | 'completed' | 'archived'

export interface User {
  id: number
  name: string
  email: string
}

export interface Task {
  id: number
  chapter_id: number
  title: string
  due_date: string | null
  is_completed: boolean
}

export interface DocumentDraft {
  id: number
  chapter_id: number
  version_label: string
  file_name: string
  mime_type: string
  file_size_bytes: number
  created_at: string
  download_url: string
}

export interface Chapter {
  id: number
  research_id: number
  title: string
  order: number
  status: ChapterStatus
  progress_percent: number
  tasks?: Task[]
  drafts?: DocumentDraft[]
}

export interface ActionItem {
  id: number
  description: string
  is_resolved: boolean
}

export interface SupervisionLog {
  id: number
  research_id: number
  chapter_id: number | null
  meeting_date: string
  feedback_notes: string
  action_items?: ActionItem[]
}

export interface Research {
  id: number
  title: string
  faculty_field: string | null
  supervisor_name: string | null
  target_completion_date: string | null
  status: ResearchStatus
  progress_percent?: number
  chapters?: Chapter[]
  supervision_logs?: SupervisionLog[]
  created_at: string
}

export interface Response<T> {
  data: T
}
