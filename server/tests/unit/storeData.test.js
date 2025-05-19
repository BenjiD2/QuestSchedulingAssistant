/**
 * Unit-tests for server/src/services/userService.js (Mongoose edition)
 * - we stub **only** the handful of `mongoose` Model methods the service calls.
 *
 *  ▸ createUser           → User.create
 *  ▸ getUserById          → User.findOne
 *  ▸ updateUserXP         → User.findOne ➜ doc.save()
 *  ▸ updateUserStreak     → User.findOne ➜ doc.save()
 *  ▸ addAchievement       → User.findOne ➜ doc.save()
 *  ▸ addCompletedTask     → User.findOne ➜ doc.save()
 */

jest.mock('../../models/User.js', () => ({
  /* Each static Model method will be replaced on-the-fly inside the tests */
  create    : jest.fn(),
  findOne   : jest.fn(),
  findOneAndUpdate : jest.fn(),
  deleteOne : jest.fn()
}));

const User = require('../../models/User.js');              // mocked above
const {
  createUser,
  getUserById,
  updateUserXP,
  updateUserStreak,
  addAchievement,
  addCompletedTask
} = require('../../services/userService.js');

/* ──────────────────────────────────── helpers ───────────────────────────────── */
const baseUser = {
  userId : 'u1',
  name   : 'Testy McTestFace',
  email  : 'test@example.com',
  xp     : 0,
  streak : 0,
  achievements  : [],
  completedTasks: []
};

function mockDoc(data = {}) {
  return { ...baseUser, ...data, save: jest.fn().mockResolvedValue(true) };
}

/* ────────────────────────────────── test cases ─────────────────────────────── */
describe('User Service (Mongoose)', () => {

  beforeEach(() => jest.clearAllMocks());

  /* createUser ───────────────────────────── */
  it('createUser() inserts a new user doc and returns it', async () => {
    User.create.mockResolvedValue(baseUser);

    const res = await createUser(baseUser);

    expect(User.create).toHaveBeenCalledWith(baseUser);
    expect(res).toEqual(baseUser);
  });

  /* getUserById ──────────────────────────── */
  describe('getUserById()', () => {
    it('returns a user when found', async () => {
      User.findOne.mockResolvedValue(baseUser);

      const res = await getUserById('u1');

      expect(User.findOne).toHaveBeenCalledWith({ userId:'u1' });
      expect(res).toEqual(baseUser);
    });

    it('returns null when not found', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await getUserById('missing');

      expect(res).toBeNull();
    });
  });

  /* updateUserXP ─────────────────────────── */
  it('updateUserXP() sets xp and saves', async () => {
    const doc = mockDoc({ xp: 0 });
    User.findOne.mockResolvedValue(doc);

    const res = await updateUserXP('u1', 42);

    expect(doc.xp).toBe(42);
    expect(doc.save).toHaveBeenCalled();
    expect(res).toEqual(doc);
  });

  /* updateUserStreak ─────────────────────── */
  it('updateUserStreak() sets streak and saves', async () => {
    const doc = mockDoc({ streak: 0 });
    User.findOne.mockResolvedValue(doc);

    const res = await updateUserStreak('u1', 5);

    expect(doc.streak).toBe(5);
    expect(doc.save).toHaveBeenCalled();
    expect(res).toEqual(doc);
  });

  /* addAchievement ───────────────────────── */
  it('addAchievement() appends an achievement and saves', async () => {
    const ach = { type:'LEVEL_UP', timestamp:Date.now() };
    const doc = mockDoc();
    User.findOne.mockResolvedValue(doc);

    const res = await addAchievement('u1', ach);

    expect(doc.achievements).toContainEqual(ach);
    expect(doc.save).toHaveBeenCalled();
    expect(res).toEqual(doc);
  });

  /* addCompletedTask ─────────────────────── */
  it('addCompletedTask() appends a completed task and saves', async () => {
    const task = { taskId:'t1', completedAt:new Date().toISOString() };
    const doc = mockDoc();
    User.findOne.mockResolvedValue(doc);

    const res = await addCompletedTask('u1', task);

    expect(doc.completedTasks).toContainEqual(task);
    expect(doc.save).toHaveBeenCalled();
    expect(res).toEqual(doc);
  });
});
