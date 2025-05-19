/**
 * Unit Tests for User Service (server/src/services/userService.js)
 * Tests createUser, getUserById, updateUserXP, updateUserStreak,
 * addAchievement, and addCompletedTask by mocking Mongoose model methods.
 */

import {
  createUser,
  getUserById,
  updateUserXP,
  updateUserStreak,
  addAchievement,
  addCompletedTask
} from '../../services/userService.js';

jest.mock('../../models/User.js', () => {
    const fn = () => {};                          // placeholder
    return {
      __esModule: true,                           // so “import … default” works
      default: {
        create:            jest.fn(),             // User.create()
        findOne:           jest.fn(),             // User.findOne()
        findOneAndUpdate:  jest.fn(),             // User.findOneAndUpdate()
        deleteOne:         jest.fn()              // User.deleteOne()
      }
    };
  });
  import User from '../../models/User.js';        // import **after** the mock

describe('User Service (Mongoose)', () => {
  const baseUser = {
    userId: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    xp: 0,
    level: 1,
    completedTasks: [],
    achievements: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // createUser → User.create()
  describe('createUser()', () => {
    it('inserts a new user and returns it', async () => {
      User.create.mockResolvedValue(baseUser);

      const result = await createUser(baseUser);

      expect(User.create).toHaveBeenCalledWith(baseUser);
      expect(result).toEqual(baseUser);
    });
  });

  // getUserById → User.findOne()
  describe('getUserById()', () => {
    it('returns a user when found', async () => {
      User.findOne.mockResolvedValue(baseUser);

      const result = await getUserById('u1');

      expect(User.findOne).toHaveBeenCalledWith({ userId: 'u1' });
      expect(result).toEqual(baseUser);
    });

    it('returns null when not found', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await getUserById('nope');

      expect(result).toBeNull();
    });
  });

  // updateUserXP → findOne + save
  describe('updateUserXP()', () => {
    it('updates xp and saves', async () => {
      const doc = { ...baseUser, xp: 0, save: jest.fn().mockResolvedValue({ ...baseUser, xp: 42 }) };
      User.findOne.mockResolvedValue(doc);

      const result = await updateUserXP('u1', 42);

      expect(User.findOne).toHaveBeenCalledWith({ userId: 'u1' });
      expect(doc.xp).toBe(42);
      expect(doc.save).toHaveBeenCalled();
      expect(result.xp).toBe(42);
    });
  });

  // updateUserStreak → findOne + save
  describe('updateUserStreak()', () => {
    it('updates streak and saves', async () => {
      const doc = { ...baseUser, streak: 0, save: jest.fn().mockResolvedValue({ ...baseUser, streak: 7 }) };
      User.findOne.mockResolvedValue(doc);

      const result = await updateUserStreak('u1', 7);

      expect(User.findOne).toHaveBeenCalledWith({ userId: 'u1' });
      expect(doc.streak).toBe(7);
      expect(doc.save).toHaveBeenCalled();
      expect(result.streak).toBe(7);
    });
  });

  // addAchievement → findOne + save
  describe('addAchievement()', () => {
    it('appends an achievement and saves', async () => {
      const ach = { type: 'DAILY_WARRIOR', timestamp: Date.now(), description: 'Test' };
      const doc = {
        ...baseUser,
        achievements: [],
        save: jest.fn().mockResolvedValue({ ...baseUser, achievements: [ach] })
      };
      User.findOne.mockResolvedValue(doc);

      const result = await addAchievement('u1', ach);

      expect(User.findOne).toHaveBeenCalledWith({ userId: 'u1' });
      expect(doc.achievements).toContainEqual(ach);
      expect(doc.save).toHaveBeenCalled();
      expect(result.achievements).toContainEqual(ach);
    });
  });

  // addCompletedTask → findOne + save
  describe('addCompletedTask()', () => {
    it('appends a completed task and saves', async () => {
      const task = { taskId: 't1', completedAt: new Date(), xpGained: 10 };
      const doc = {
        ...baseUser,
        completedTasks: [],
        save: jest.fn().mockResolvedValue({ ...baseUser, completedTasks: [task] })
      };
      User.findOne.mockResolvedValue(doc);

      const result = await addCompletedTask('u1', task);

      expect(User.findOne).toHaveBeenCalledWith({ userId: 'u1' });
      expect(doc.completedTasks).toContainEqual(task);
      expect(doc.save).toHaveBeenCalled();
      expect(result.completedTasks).toContainEqual(task);
    });
  });
});
