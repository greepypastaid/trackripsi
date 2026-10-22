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
  chapter_ids?: number[]
  chapters?: string[]
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
  citation_style?: CitationStyle
  min_supervision_sessions?: number
  readiness_checklist?: Array<{ label: string; done: boolean }>
  daily_target_minutes?: number | null
  progress_percent?: number
  chapters?: Chapter[]
  supervision_logs?: SupervisionLog[]
  created_at: string
}

export interface Response<T> {
  data: T
}

export interface TimelineEvent {
  type: 'task_completed' | 'draft_uploaded' | 'supervision_logged' | 'appointment_done'
  title: string
  chapter: string | null
  occurred_at: string
}

export type CitationStyle = 'apa7' | 'ieee' | 'harvard' | 'chicago_author_date'
export type LiteratureStatus = 'candidate' | 'included' | 'excluded'
export type LiteratureType = 'journal' | 'book' | 'thesis' | 'web' | 'other'

export interface Author {
  family: string
  given?: string
}

export interface LiteratureValue {
  synthesis_field_id: number
  value: string | null
}

export interface LiteratureEntry {
  id: number
  research_id: number
  title: string
  authors: Author[]
  year: number | null
  container: string | null
  volume: string | null
  issue: string | null
  pages: string | null
  doi: string | null
  url: string | null
  abstract: string | null
  type: LiteratureType
  status: LiteratureStatus
  exclusion_reason: string | null
  notes: string | null
  metadata_source: 'manual' | 'openalex' | 'crossref'
  values?: LiteratureValue[]
}

export interface SynthesisField {
  id: number
  label: string
  order: number
}

export interface Appointment {
  id: number
  scheduled_at: string
  agenda: string[]
  log_id: number | null
  status: 'planned' | 'done' | 'cancelled'
}

export interface ReadinessBlocker {
  key: string
  label: string
  detail: string
}

export interface ReadinessCheck {
  key: string
  label: string
  weight: number
  progress: number
  detail: string
}

export interface Readiness {
  score: number
  checks: ReadinessCheck[]
  blockers: ReadinessBlocker[]
  stats: {
    chapters_completed: number
    chapters_total: number
    supervision_logs: number
    min_supervision_sessions: number
    literature_included: number
    literature_total: number
    open_action_items: number
    upcoming_appointments: number
  }
}

export interface DefenseQuestion {
  id: number
  chapter_order: number | null
  category: 'motivasi' | 'kebaruan' | 'metode' | 'sampling' | 'teori' | 'hasil'
  text: string
  answer: string | null
  is_ready: boolean
}

export interface Logbook {
  research: {
    id: number
    title: string
    faculty_field: string | null
    supervisor_name: string | null
    min_supervision_sessions: number
  }
  sessions: Array<{
    number: number
    meeting_date: string | null
    chapters: string[]
    feedback_notes: string
    action_items: string[]
  }>
  total: number
}

export interface Citation {
  style: CitationStyle
  in_text: string
  reference: string
}

export interface Bibliography {
  style: CitationStyle
  count: number
  items: Array<{ id: number; reference: string }>
  text: string
}
