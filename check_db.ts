import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    console.log("Publications:", await prisma.publication.count().catch(() => 0));
    console.log("ResearchProjects:", await prisma.researchProject.count().catch(() => 0));
    console.log("Contributions:", await prisma.contribution.count().catch(() => 0));
    console.log("Workshops:", await prisma.workshop.count().catch(() => 0));
    console.log("Memberships:", await prisma.membership.count().catch(() => 0));
    console.log("Awards:", await prisma.award.count().catch(() => 0));

    await prisma.$disconnect();
}
check();
