/**
 * Утилиты для экспорта данных в Excel
 * Использует библиотеку xlsx (sheetjs)
 */

export interface ExcelColumn {
  header: string
  key: string
  width?: number
}

export interface ExcelRow {
  [key: string]: any
}

/**
 * Создает Excel файл из данных
 * @param data Массив объектов для экспорта
 * @param columns Конфигурация колонок
 * @param sheetName Название листа
 * @returns Buffer с Excel файлом
 */
export async function createExcelFile(
  data: ExcelRow[],
  columns: ExcelColumn[],
  sheetName: string = 'Лист1'
): Promise<Buffer> {
  // Динамический импорт xlsx для уменьшения размера бандла
  const XLSX = await import('xlsx')

  // Подготовить данные с правильными заголовками
  const headers = columns.map((col) => col.header)
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      // Форматирование дат
      if (value instanceof Date) {
        return value.toLocaleDateString('ru-RU')
      }
      // Форматирование null/undefined
      if (value === null || value === undefined) {
        return ''
      }
      return value
    })
  )

  // Создать рабочую книгу
  const workbook = XLSX.utils.book_new()

  // Создать лист с заголовками и данными
  const worksheetData = [headers, ...rows]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Установить ширину колонок
  const columnWidths = columns.map((col) => ({
    wch: col.width || 15, // ширина по умолчанию
  }))
  worksheet['!cols'] = columnWidths

  // Добавить лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Генерировать buffer
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })

  return buffer as Buffer
}

/**
 * Создает ответ с Excel файлом для скачивания
 * @param buffer Buffer с Excel файлом
 * @param filename Имя файла для скачивания
 * @returns Response с заголовками для скачивания
 */
export function createExcelResponse(buffer: Buffer, filename: string): Response {
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
