import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function verifyPIN(pin: string): Promise<boolean> {
  const parentAccount = await prisma.parentAccount.findFirst();
  if (!parentAccount?.pinHash) {
    return false;
  }
  return bcrypt.compare(pin, parentAccount.pinHash);
}

export async function setPIN(pin: string): Promise<void> {
  const pinHash = await bcrypt.hash(pin, 10);
  const parentAccount = await prisma.parentAccount.findFirst();
  if (parentAccount) {
    await prisma.parentAccount.update({
      where: { id: parentAccount.id },
      data: { pinHash },
    });
  } else {
    await prisma.parentAccount.create({
      data: {
        id: 'default-parent',
        pinHash,
        settingsJson: JSON.stringify({
          questionTypes: {
            enToHe: true,
            heToEn: true,
            audioToEn: true,
          },
          quizLength: 10,
          extraLearningStrategy: 'unseen',
          streakRule: 'either',
          rewardIntensity: 'normal',
        }),
      },
    });
  }
}

export async function hasPIN(): Promise<boolean> {
  const parentAccount = await prisma.parentAccount.findFirst();
  return !!parentAccount?.pinHash;
}
