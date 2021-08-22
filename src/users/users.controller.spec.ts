import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({
          id,
          email: 'test@email.com',
          password: '123456',
        } as unknown as User);
      },
      find: (email: string) => {
        return Promise.resolve([
          {
            id: 1,
            email,
            password: '123456',
          } as unknown as User,
        ]);
      },
      // remove: () => {},
      // update: () => {},
    };

    fakeAuthService = {
      // signup: () => {},
      signin: (email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as unknown as User);
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllUsers should find all users', async () => {
    const users = await controller.findAllUsers('teste@email.com');
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('teste@email.com');
  });

  it('findUser return a single user with the given id', async () => {
    const user = await controller.findUser('1');
    expect(user).toBeDefined();
  });

  it('findUser should throw an error if user with givin id is not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(controller.findUser('2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('signin updats session object and return user', async () => {
    const session = { userId: -10 };
    const user = await controller.signin(
      { email: 'teste@email.com', password: '123456' },
      session,
    );

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  });
});
