'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Filter, RefreshCw, Eye, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface ActivityLog {
  id: string
  userId: string
  action: string
  entityType: string | null
  entityId: string | null
  ipAddress: string | null
  details: any
  result: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface ActivityLogsResponse {
  logs: ActivityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ActivityLogPage() {
  const t = useTranslations()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Функция для получения URL сущности на основе типа
  const getEntityUrl = (entityType: string | null, entityId: string | null): string | null => {
    if (!entityType || !entityId) {
      return null
    }

    const entityRoutes: Record<string, string> = {
      'User': `/admin/users`,
      'Group': `/admin/groups`,
      'Subject': `/admin/subjects`,
      'Schedule': `/admin/schedule`,
      'Homework': `/admin/homework`,
      'Exam': `/admin/exams`,
      'Attendance': `/admin/attendance`,
      'Subgroup': `/admin/subgroups`,
      'ExternalResource': `/admin/resources`,
      'BotSettings': `/admin/settings`
    }

    const baseUrl = entityRoutes[entityType]
    if (!baseUrl) {
      return null
    }

    // Для некоторых сущностей можно добавить параметр поиска или идентификатор
    // Но так как большинство страниц - это списки, просто возвращаем базовый URL
    return baseUrl
  }

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.userId) params.append('userId', filters.userId)
      if (filters.action) params.append('action', filters.action)
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/activity-logs?${params.toString()}`)
      if (response.ok) {
        const data: ActivityLogsResponse = await response.json()
        setLogs(data.logs || [])
        setPagination(data.pagination)
      } else {
        toast.error(t('admin.pages.activityLog.toast.loadError'))
      }
    } catch (error) {
      console.error('Ошибка при загрузке логов:', error)
      toast.error(t('admin.pages.activityLog.toast.loadError'))
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit, t])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const resetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entityType: '',
      startDate: '',
      endDate: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const viewDetails = (log: ActivityLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CREATE': t('admin.pages.activityLog.actions.create'),
      'UPDATE': t('admin.pages.activityLog.actions.update'),
      'DELETE': t('admin.pages.activityLog.actions.delete'),
      'LOGIN': t('admin.pages.activityLog.actions.login'),
      'LOGOUT': t('admin.pages.activityLog.actions.logout'),
      'SETTINGS_CHANGE': t('admin.pages.activityLog.actions.settingsChange')
    }
    return labels[action] || action
  }

  const getResultBadge = (result: string) => {
    if (result === 'SUCCESS') {
      return <Badge className="bg-green-100 text-green-800">{t('admin.pages.activityLog.result.success')}</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">{t('admin.pages.activityLog.result.failure')}</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('admin.pages.activityLog.title')}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('admin.pages.activityLog.description')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            {t('common.labels.filter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="userId" className="mb-2 block">{t('admin.pages.activityLog.filters.user')}</Label>
              <Input
                id="userId"
                placeholder={t('admin.pages.activityLog.filters.userPlaceholder')}
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="action" className="mb-2 block">{t('admin.pages.activityLog.filters.action')}</Label>
              <Select value={filters.action || undefined} onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}>
                <SelectTrigger id="action">
                  <SelectValue placeholder={t('admin.pages.activityLog.filters.actionPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.filters.all')}</SelectItem>
                  <SelectItem value="CREATE">{t('admin.pages.activityLog.actions.create')}</SelectItem>
                  <SelectItem value="UPDATE">{t('admin.pages.activityLog.actions.update')}</SelectItem>
                  <SelectItem value="DELETE">{t('admin.pages.activityLog.actions.delete')}</SelectItem>
                  <SelectItem value="SETTINGS_CHANGE">{t('admin.pages.activityLog.actions.settingsChange')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entityType" className="mb-2 block">{t('admin.pages.activityLog.filters.entityType')}</Label>
              <Select value={filters.entityType || undefined} onValueChange={(value) => handleFilterChange('entityType', value === 'all' ? '' : value)}>
                <SelectTrigger id="entityType">
                  <SelectValue placeholder={t('admin.pages.activityLog.filters.entityTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.filters.all')}</SelectItem>
                  <SelectItem value="User">{t('admin.pages.activityLog.entities.user')}</SelectItem>
                  <SelectItem value="Group">{t('admin.pages.activityLog.entities.group')}</SelectItem>
                  <SelectItem value="Subject">{t('admin.pages.activityLog.entities.subject')}</SelectItem>
                  <SelectItem value="Schedule">{t('admin.pages.activityLog.entities.schedule')}</SelectItem>
                  <SelectItem value="Homework">{t('admin.pages.activityLog.entities.homework')}</SelectItem>
                  <SelectItem value="BotSettings">{t('admin.pages.activityLog.entities.settings')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate" className="mb-2 block">{t('admin.pages.activityLog.filters.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="mb-2 block">{t('admin.pages.activityLog.filters.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                {t('common.buttons.reset')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('admin.pages.activityLog.table.title')}</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.buttons.refresh')}
            </Button>
          </div>
          <CardDescription>
            {t('admin.pages.activityLog.table.description', { total: pagination.total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('common.messages.loading')}</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('admin.pages.activityLog.table.noData')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.pages.activityLog.table.columns.time')}</TableHead>
                      <TableHead>{t('admin.pages.activityLog.table.columns.user')}</TableHead>
                      <TableHead>{t('admin.pages.activityLog.table.columns.action')}</TableHead>
                      <TableHead>{t('admin.pages.activityLog.table.columns.entity')}</TableHead>
                      <TableHead>{t('admin.pages.activityLog.table.columns.ipAddress')}</TableHead>
                      <TableHead>{t('admin.pages.activityLog.table.columns.result')}</TableHead>
                      <TableHead>{t('admin.pages.activityLog.table.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user.name || log.user.email}</div>
                            <div className="text-sm text-gray-500">{log.user.role}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.entityType ? (
                            <div>
                              <div className="font-medium">{log.entityType}</div>
                              {log.entityId && (
                                <div className="text-xs text-gray-500 font-mono">{log.entityId.slice(0, 8)}...</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          {getResultBadge(log.result)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDetails(log)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('common.actions.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    {t('admin.pages.activityLog.pagination.info', {
                      page: pagination.page,
                      pages: pagination.pages,
                      total: pagination.total
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('common.buttons.back')}
                    </Button>
                    <span className="text-sm text-gray-600">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                    >
                      {t('common.buttons.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {detailsOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('admin.pages.activityLog.details.title')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setDetailsOpen(false)}>
                  {t('common.buttons.close')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('admin.pages.activityLog.details.basicInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('admin.pages.activityLog.details.time')}:</span>
                    <div className="font-mono">{formatDate(selectedLog.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('admin.pages.activityLog.details.user')}:</span>
                    <div>{selectedLog.user.name || selectedLog.user.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('admin.pages.activityLog.details.action')}:</span>
                    <div>{getActionLabel(selectedLog.action)}</div>
                  </div>
                  {selectedLog.entityType && (
                    <div>
                      <span className="text-gray-500">Сущность:</span>
                      <div className="font-medium">{selectedLog.entityType}</div>
                      {selectedLog.entityId && (
                        <div className="text-xs text-gray-500 font-mono mt-1">{selectedLog.entityId}</div>
                      )}
                      {getEntityUrl(selectedLog.entityType, selectedLog.entityId) && (
                        <Link
                          href={getEntityUrl(selectedLog.entityType, selectedLog.entityId)!}
                          className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                          onClick={() => setDetailsOpen(false)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Перейти к сущности
                        </Link>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">{t('admin.pages.activityLog.details.result')}:</span>
                    <div>{getResultBadge(selectedLog.result)}</div>
                  </div>
                  {selectedLog.ipAddress && (
                    <div>
                      <span className="text-gray-500">{t('admin.pages.activityLog.details.ipAddress')}:</span>
                      <div className="font-mono">{selectedLog.ipAddress}</div>
                    </div>
                  )}
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.pages.activityLog.details.changes')}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedLog.details.changes && selectedLog.details.changes.length > 0 ? (
                      <div className="space-y-3">
                        {selectedLog.details.changes.map((change: any, index: number) => (
                          <div key={index} className="border-b border-gray-200 pb-2 last:border-0">
                            <div className="font-medium text-sm mb-1">{change.field}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Было:</span>
                                <div className="bg-red-50 p-2 rounded mt-1">
                                  {change.oldValue === null ? (
                                    <span className="text-gray-400 italic">null</span>
                                  ) : typeof change.oldValue === 'object' ? (
                                    <pre className="text-xs">{JSON.stringify(change.oldValue, null, 2)}</pre>
                                  ) : (
                                    String(change.oldValue)
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Стало:</span>
                                <div className="bg-green-50 p-2 rounded mt-1">
                                  {change.newValue === null ? (
                                    <span className="text-gray-400 italic">null</span>
                                  ) : typeof change.newValue === 'object' ? (
                                    <pre className="text-xs">{JSON.stringify(change.newValue, null, 2)}</pre>
                                  ) : (
                                    String(change.newValue)
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedLog.details.after ? (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 mb-2">Созданные/новые данные:</div>
                        <div className="bg-green-50 p-3 rounded">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.details.after, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : selectedLog.details.error ? (
                      <div className="bg-red-50 p-3 rounded">
                        <div className="text-sm text-red-600 font-medium">Ошибка:</div>
                        <div className="text-sm text-red-800 mt-1">{selectedLog.details.error}</div>
                      </div>
                    ) : (
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

