import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserData, UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email.toLowerCase());
  }

  create(data: CreateUserData): Promise<User> {
    return this.users.create({ ...data, email: data.email.toLowerCase() });
  }

  async getProfile(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return UserResponseDto.from(user);
  }
}
