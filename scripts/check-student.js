
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const student = await prisma.user.findUnique({
    where: { email: 'student@demo.com' },
    include: { group: true }
  })
  console.log('Student:', student)
  
  const homework = await prisma.homework.findUnique({
    where: { id: 'cmhjmzwaq003m9ktlj9zsigzw' },
    include: { group: true }
  })
  console.log('Homework:', homework)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
