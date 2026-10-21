import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
}

/** Picker tanggal shadcn (Popover + Calendar) yang dipakai lintas halaman. */
export function DatePicker({ value, onChange, placeholder = 'Pilih tanggal', ariaLabel, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={ariaLabel} className={`justify-start font-normal ${className ?? ''}`}>
          <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {value ? format(value, 'd MMM yyyy', { locale: localeId }) : placeholder}
          </span>
          <ChevronDown aria-hidden="true" className="ms-auto size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  )
}
