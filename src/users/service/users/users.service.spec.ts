import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../entities/users/users.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2026-02-03T10:00:00.000Z'),
    updatedAt: new Date('2026-02-03T10:00:00.000Z'),
    urls: [],
  };

  const mockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário quando email existir', async () => {
      const email = 'test@example.com';
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('deve retornar null quando email não existir', async () => {
      const email = 'nonexistent@example.com';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário quando id existir', async () => {
      const userId = 'user-uuid-1';
      const { password, ...userWithoutPassword } = mockUser;

      mockRepository.findOne.mockResolvedValue(userWithoutPassword);

      const result = await service.findById(userId);

      expect(result).toEqual(userWithoutPassword);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'email', 'createdAt', 'updatedAt'],
      });
    });

    it('deve retornar null quando id não existir', async () => {
      const userId = 'nonexistent-uuid';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(userId);

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'email', 'createdAt', 'updatedAt'],
      });
    });

    it('não deve retornar a senha do usuário', async () => {
      const userId = 'user-uuid-1';
      const userWithoutPassword = {
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockRepository.findOne.mockResolvedValue(userWithoutPassword);

      const result = await service.findById(userId);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
    });
  });
});
