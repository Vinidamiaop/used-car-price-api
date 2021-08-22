import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as unknown as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('vini@email.com', '123456');

    expect(user.password).not.toEqual('123456');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('teste@email.com', '123456');

    await expect(
      service.signup('teste@email.com', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws if sign in is called with an unused email', async () => {
    expect.assertions(1);
    await expect(
      service.signin('unused@email.com', '123456'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('vini@email.com', '65324');

    await expect(
      service.signin('vini@email.com', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return a user if correct password is provided', async () => {
    await service.signup('vini@email.com', '123456');
    const user = await service.signin('vini@email.com', '123456');
    expect(user).toBeDefined();
  });
});
