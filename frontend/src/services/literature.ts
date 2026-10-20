import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type {
  Appointment,
  Bibliography,
  Citation,
  CitationStyle,
  DefenseQuestion,
  LiteratureEntry,
  Logbook,
  Readiness,
  Response,
  SupervisionLog,
  SynthesisField,
} from './types'

/* F1/F2 — matriks literatur, kolom sintesis, sitasi. */

export function useLiterature(id: number, params: { status?: string; q?: string } = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.q) query.set('q', params.q)
  const suffix = query.size ? `?${query}` : ''

  return useQuery({
    queryKey: ['literature', id, params.status ?? 'all', params.q ?? ''],
    queryFn: () =>
      api<Response<LiteratureEntry[]>>(`/researches/${id}/literature${suffix}`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function useSynthesisFields(id: number) {
  return useQuery({
    queryKey: ['synthesis-fields', id],
    queryFn: () =>
      api<Response<SynthesisField[]>>(`/researches/${id}/synthesis-fields`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

function useLiteratureInvalidator(id: number) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['literature', id] })
    qc.invalidateQueries({ queryKey: ['readiness', id] })
  }
}

export function useImportDoi(id: number) {
  const invalidate = useLiteratureInvalidator(id)
  return useMutation({
    mutationFn: (doi: string) =>
      api<Response<LiteratureEntry>>(`/researches/${id}/literature/import-doi`, {
        method: 'POST',
        body: { doi },
      }).then((r) => r.data),
    onSuccess: invalidate,
  })
}

export function useCreateLiterature(id: number) {
  const invalidate = useLiteratureInvalidator(id)
  return useMutation({
    mutationFn: (body: Partial<LiteratureEntry>) =>
      api<Response<LiteratureEntry>>(`/researches/${id}/literature`, {
        method: 'POST',
        body,
      }).then((r) => r.data),
    onSuccess: invalidate,
  })
}

export function useUpdateLiterature(id: number) {
  const invalidate = useLiteratureInvalidator(id)
  return useMutation({
    mutationFn: ({ entryId, ...body }: Partial<LiteratureEntry> & { entryId: number }) =>
      api<Response<LiteratureEntry>>(`/literature/${entryId}`, { method: 'PATCH', body }).then(
        (r) => r.data,
      ),
    onSuccess: invalidate,
  })
}

export function useDeleteLiterature(id: number) {
  const invalidate = useLiteratureInvalidator(id)
  return useMutation({
    mutationFn: (entryId: number) => api(`/literature/${entryId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useSaveMatrixValues(id: number) {
  const invalidate = useLiteratureInvalidator(id)
  return useMutation({
    mutationFn: ({
      entryId,
      values,
    }: {
      entryId: number
      values: Array<{ synthesis_field_id: number; value: string }>
    }) =>
      api<Response<LiteratureEntry>>(`/literature/${entryId}/values`, {
        method: 'PUT',
        body: { values },
      }).then((r) => r.data),
    onSuccess: invalidate,
  })
}

export function useCreateSynthesisField(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (label: string) =>
      api<Response<SynthesisField>>(`/researches/${id}/synthesis-fields`, {
        method: 'POST',
        body: { label },
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['synthesis-fields', id] }),
  })
}

export function useDeleteSynthesisField(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fieldId: number) => api(`/synthesis-fields/${fieldId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['synthesis-fields', id] })
      qc.invalidateQueries({ queryKey: ['literature', id] })
    },
  })
}

export function useCitation(id: number, entryId: number | null, style: CitationStyle) {
  return useQuery({
    queryKey: ['citation', id, entryId, style],
    queryFn: () =>
      api<Response<Citation>>(
        `/researches/${id}/literature/${entryId}/citation?style=${style}`,
      ).then((r) => r.data),
    enabled: Number.isFinite(id) && entryId !== null,
  })
}

export function useBibliography(id: number, style: CitationStyle) {
  return useQuery({
    queryKey: ['bibliography', id, style],
    queryFn: () =>
      api<Response<Bibliography>>(
        `/researches/${id}/literature/bibliography?style=${style}`,
      ).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

/* F3 — jadwal bimbingan. */

type AppointmentsResponse = Response<Appointment[]> & { meta: { next: Appointment | null } }

export function useAppointments(id: number) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () =>
      api<AppointmentsResponse>(`/researches/${id}/appointments`),
    enabled: Number.isFinite(id),
  })
}

export function useSuggestedAgenda(id: number, enabled = true) {
  return useQuery({
    queryKey: ['suggested-agenda', id],
    queryFn: () =>
      api<Response<string[]>>(`/researches/${id}/appointments/suggested-agenda`).then((r) => r.data),
    enabled: Number.isFinite(id) && enabled,
  })
}

export function useAppointmentMutations(id: number) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['appointments', id] })
    qc.invalidateQueries({ queryKey: ['readiness', id] })
  }

  const create = useMutation({
    mutationFn: (body: { scheduled_at: string; agenda: string[] }) =>
      api<Response<Appointment>>(`/researches/${id}/appointments`, {
        method: 'POST',
        body,
      }).then((r) => r.data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ appointmentId, ...body }: { appointmentId: number; status?: string }) =>
      api<Response<Appointment>>(`/appointments/${appointmentId}`, {
        method: 'PATCH',
        body,
      }).then((r) => r.data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (appointmentId: number) =>
      api(`/appointments/${appointmentId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })

  const complete = useMutation({
    mutationFn: ({
      appointmentId,
      ...body
    }: { appointmentId: number; chapter_id: number | null; meeting_date: string; feedback_notes: string; action_items: string[] }) =>
      api<Response<SupervisionLog>>(
        `/researches/${id}/appointments/${appointmentId}/complete`,
        { method: 'POST', body },
      ).then((r) => r.data),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['research', id] })
    },
  })

  return { create, update, remove, complete }
}

/* F4 — kesiapan sidang. */

export function useReadiness(id: number) {
  return useQuery({
    queryKey: ['readiness', id],
    queryFn: () => api<Response<Readiness>>(`/researches/${id}/readiness`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function useUpdateReadinessChecklist(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (checklist: Array<{ label: string; done: boolean }>) =>
      api<Response<Readiness>>(`/researches/${id}/readiness/checklist`, {
        method: 'PUT',
        body: { checklist },
      }).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['readiness', id], data)
      qc.invalidateQueries({ queryKey: ['research', id] })
    },
  })
}

/* F5 — logbook cetak. */

export function useLogbook(id: number) {
  return useQuery({
    queryKey: ['logbook', id],
    queryFn: () => api<Response<Logbook>>(`/researches/${id}/logbook`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

/* F6 — bank pertanyaan sidang. */

export function useDefenseQuestions(id: number) {
  return useQuery({
    queryKey: ['defense-questions', id],
    queryFn: () =>
      api<Response<DefenseQuestion[]>>(`/researches/${id}/defense-questions`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function useSaveDefenseAnswer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      questionId,
      answer,
      is_ready,
    }: {
      questionId: number
      answer: string
      is_ready: boolean
    }) =>
      api(`/researches/${id}/defense-questions/${questionId}/answer`, {
        method: 'PUT',
        body: { answer, is_ready },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['defense-questions', id] }),
  })
}
