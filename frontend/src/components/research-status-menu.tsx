import { toast } from 'sonner'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useUpdateResearch } from '@/services/researches'
import { RESEARCH_STATUS_LABEL } from '@/components/status-badge'
import type { Research, ResearchStatus } from '@/services/types'

/**
 * Status yang bisa dipilih cepat dari menu. `completed` dan `archived` tetap
 * disediakan karena riset lama mungkin sudah berstatus itu.
 */
export const RESEARCH_STATUS_OPTIONS: ResearchStatus[] = [
  'active',
  'paused',
  'inactive',
  'completed',
  'archived',
]

/** Item radio siap pakai di dalam DropdownMenuContent mana pun. */
export function ResearchStatusMenuItems({ research }: { research: Research }) {
  const update = useUpdateResearch()

  const change = (status: string) => {
    if (status === research.status) return
    update.mutate(
      { id: research.id, status: status as ResearchStatus },
      {
        onSuccess: () =>
          toast.success(`Status jadi “${RESEARCH_STATUS_LABEL[status as ResearchStatus]}”.`),
        onError: () => toast.error('Statusnya belum berubah. Coba lagi.'),
      },
    )
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Status riset</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={research.status} onValueChange={change}>
        {RESEARCH_STATUS_OPTIONS.map((status) => (
          <DropdownMenuRadioItem key={status} value={status} disabled={update.isPending}>
            {RESEARCH_STATUS_LABEL[status]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  )
}
