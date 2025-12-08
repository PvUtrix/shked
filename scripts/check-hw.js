
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const id = 'cmhjmzwaq003m9ktlj9zsigzw'
  const homework = await prisma.homework.findUnique({
    where: { id }
  })
  console.log('Homework found:', homework)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
