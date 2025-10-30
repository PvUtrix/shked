'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface Subgroup {
  id: string
  name: string
  number: number
  subjectId: string | null
  subject?: {
    id: string
    name: string
  } | null
  _count?: {
    students: number
  }
}

interface SubgroupSelectorProps {
  groupId: string
  subjectId?: string
  value?: string
  onChange: (subgroupId: string | null) => void
  placeholder?: string
  allowNull?: boolean // Разрешить выбор "Вся группа"
  className?: string
  disabled?: boolean
}

export function SubgroupSelector({
  groupId,
  subjectId,
  value,
  onChange,
  placeholder = 'Выберите подгруппу',
  allowNull = true,
  className,
  disabled = false
}: SubgroupSelectorProps) {
  const [open, setOpen] = useState(false)
  const [subgroups, setSubgroups] = useState<Subgroup[]>([])
  const [loading, setLoading] = useState(true)

  // Загрузка подгрупп
  useEffect(() => {
    const fetchSubgroups = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (subjectId) {
          params.append('subjectId', subjectId)
        }

        const response = await fetch(`/api/groups/${groupId}/subgroups?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSubgroups(data)
        }
      } catch (error) {
        console.error('Ошибка при загрузке подгрупп:', error)
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchSubgroups()
    }
  }, [groupId, subjectId])

  // Найти выбранную подгруппу
  const selectedSubgroup = value
    ? subgroups.find((sg) => sg.id === value)
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
          disabled={disabled || loading}
        >
          {loading ? (
            'Загрузка...'
          ) : selectedSubgroup ? (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{selectedSubgroup.name}</span>
              {selectedSubgroup._count && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSubgroup._count.students}
                </Badge>
              )}
            </div>
          ) : value === null && allowNull ? (
            'Вся группа'
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Поиск подгруппы..." />
          <CommandEmpty>Подгруппы не найдены</CommandEmpty>
          <CommandGroup>
            {allowNull && (
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Users className="mr-2 h-4 w-4" />
                <span>Вся группа</span>
              </CommandItem>
            )}
            {subgroups.map((subgroup) => (
              <CommandItem
                key={subgroup.id}
                value={subgroup.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? null : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === subgroup.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Users className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <div className="font-medium">{subgroup.name}</div>
                    {subgroup.subject && (
                      <div className="text-xs text-muted-foreground">
                        {subgroup.subject.name}
                      </div>
                    )}
                  </div>
                  {subgroup._count && (
                    <Badge variant="outline">
                      {subgroup._count.students}
                    </Badge>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


