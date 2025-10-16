'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Выберите дату и время',
  className,
  disabled = false
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = useState(
    value ? format(value, 'HH:mm') : ''
  )

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    } else if (date) {
      onChange(date)
    }
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (selectedDate && time) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    }
  }

  const handleConfirm = () => {
    if (selectedDate && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    }
    setOpen(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'dd.MM.yyyy HH:mm', { locale: ru }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Дата</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={ru}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Время</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleConfirm}>
                Применить
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
