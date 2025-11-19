'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Search, Loader2, Check } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

export function AddFacultyModal() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&role=staff`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      }
    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleAddFaculty = async () => {
    if (selectedUsers.length === 0) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/department/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      })

      if (!response.ok) {
        throw new Error('Failed to add faculty')
      }

      toast({
        title: 'Сотрудники добавлены',
        description: `Успешно добавлено ${selectedUsers.length} сотрудников`,
      })
      
      setOpen(false)
      setSelectedUsers([])
      setSearchResults([])
      setSearchQuery('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить сотрудников',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Добавить сотрудника
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить сотрудника</DialogTitle>
          <DialogDescription>
            Найдите и выберите пользователей для добавления в состав кафедры.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email или имя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button size="icon" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          <ScrollArea className="h-[200px] rounded-md border p-2">
            {searchResults.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {searchQuery ? 'Ничего не найдено' : 'Введите запрос для поиска'}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user.id) ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{user.name || 'Без имени'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleAddFaculty} disabled={selectedUsers.length === 0 || isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Добавить ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
