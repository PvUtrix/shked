
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const group = await prisma.group.findFirst({
    where: { name: 'ТехПред МФТИ 2025-27' }
  })

  if (!group) {
    console.error('Group not found')
    return
  }

  const student = await prisma.user.update({
    where: { email: 'student@demo.com' },
    data: { groupId: group.id }
  })
  console.log('Updated student group:', student)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
