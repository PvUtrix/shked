
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const student = await prisma.user.findUnique({
    where: { email: 'student@demo.com' },
    select: { groupId: true }
  })
  console.log('Student Group ID:', student.groupId)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
