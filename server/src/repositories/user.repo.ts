import { prisma } from '../utils/db';
import type { User } from '@prisma/client';
import { CreateUserDTO } from '../types/user';

class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserDTO): Promise<User> {
    return prisma.user.create({ data });
  }
}

export const userRepository = new UserRepository();
