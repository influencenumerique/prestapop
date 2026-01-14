import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const driver = await db.driverProfile.findFirst({
    include: { user: true }
  });

  const job = await db.job.findFirst({
    where: { status: 'OPEN' },
    include: { company: true }
  });

  if (!driver || !job) {
    console.log('Driver ou Job non trouvé');
    return;
  }

  console.log('Driver:', driver.user.name, '- ID:', driver.id);
  console.log('Job:', job.title, '- ID:', job.id);

  let booking = await db.booking.findFirst({
    where: { jobId: job.id, driverId: driver.id }
  });

  if (booking) {
    booking = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: 'IN_PROGRESS',
        pickedUpAt: new Date()
      }
    });
    console.log('Booking mis à jour:', booking.id);
  } else {
    booking = await db.booking.create({
      data: {
        jobId: job.id,
        driverId: driver.id,
        status: 'IN_PROGRESS',
        agreedPrice: job.dayRate,
        pickedUpAt: new Date(),
        stripePaymentStatus: 'payment_paid'
      }
    });
    console.log('Booking créé:', booking.id);
  }

  await db.job.update({
    where: { id: job.id },
    data: { status: 'IN_PROGRESS' }
  });

  console.log('');
  console.log('=== Mission de test prête ===');
  console.log('Job ID:', job.id);
  console.log('Booking ID:', booking.id);
  console.log('URL: http://localhost:3000/jobs/' + job.id);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
