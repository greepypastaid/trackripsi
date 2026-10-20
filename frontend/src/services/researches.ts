import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Chapter, Response, Research, SupervisionLog, Task } from './types'

export function useResearches() {
  return useQuery({
    queryKey: ['researches'],
    queryFn: () => api<Response<Research[]>>('/researches').then((r) => r.data),
  })
}

export function useResearch(id: number) {
  return useQuery({
    queryKey: ['research', id],
    queryFn: () => api<Response<Research>>(`/researches/${id}`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function useCreateResearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Research>) =>
      api<Response<Research>>('/researches', { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['researches'] }),
  })
}

export function useToggleTask(researchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (task: Task) =>
      api<Response<Task>>(`/tasks/${task.id}/toggle`, { method: 'PATCH' }).then((r) => r.data),
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ['research', researchId] })
      const previous = qc.getQueryData<Research>(['research', researchId])
      qc.setQueryData<Research>(['research', researchId], (old) =>
        old
          ? {
              ...old,
              chapters: old.chapters?.map((chapter) => ({
                ...chapter,
                tasks: chapter.tasks?.map((t) =>
                  t.id === task.id ? { ...t, is_completed: !t.is_completed } : t,
                ),
              })),
            }
          : old,
      )
      return { previous }
    },
    onError: (_err, _task, context) => {
      if (context?.previous) qc.setQueryData(['research', researchId], context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['research', researchId] }),
  })
}

export function useCreateTask(researchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ chapterId, title, due_date }: { chapterId: number; title: string; due_date?: string }) =>
      api<Response<Task>>(`/chapters/${chapterId}/tasks`, {
        method: 'POST',
        body: { title, due_date },
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research', researchId] }),
  })
}

export function useUpdateChapter(researchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ chapterId, ...body }: Partial<Chapter> & { chapterId: number }) =>
      api<Response<Chapter>>(`/chapters/${chapterId}`, { method: 'PATCH', body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research', researchId] }),
  })
}

export function useCreateLog(researchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      meeting_date: string
      chapter_ids: number[]
      feedback_notes: string
      action_items: string[]
    }) => api<Response<SupervisionLog>>(`/researches/${researchId}/logs`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research', researchId] }),
  })
}

export function useConvertActionItems(researchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logId: number) =>
      api(`/logs/${logId}/convert-action-items`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research', researchId] }),
  })
}

export function useUploadDraft(researchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ chapterId, file }: { chapterId: number; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api(`/chapters/${chapterId}/drafts`, { method: 'POST', body: form })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research', researchId] }),
  })
}
