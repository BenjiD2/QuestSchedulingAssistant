/**
 * Unit Tests for User Service (server/src/services/userService.js)
 * Tests createUser, getUserById, updateUserXP, updateUserStreak,
 * addAchievement, and addCompletedTask by mocking the DB client.
 */

import {
    createUser,
    getUserById,
    updateUserXP,
    updateUserStreak,
    addAchievement,
    addCompletedTask
  } from '../../../server/src/services/userService'
  import dbClient from '../../../server/src/database/dbClient'
  
  jest.mock('../../../server/src/database/dbClient')
  
  describe('User Service', () => {
    const baseUser = {
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      xp: 0,
      streak: 0,
      achievements: [],
      completedTasks: []
    }
  
    beforeEach(() => {
      jest.clearAllMocks()
    })
  
    // createUser: inserts a new user record into the database
    describe('createUser()', () => {
      it('inserts a new user and returns it', async () => {
        dbClient.insert.mockResolvedValue(baseUser)
  
        const result = await createUser(baseUser)
  
        expect(dbClient.insert).toHaveBeenCalledWith('users', baseUser)
        expect(result).toEqual(baseUser)
      })
    })
  
    // getUserById: retrieves a user by ID, returns null if not found
    describe('getUserById()', () => {
      it('returns a user when found', async () => {
        dbClient.select.mockResolvedValue([baseUser])
  
        const result = await getUserById('u1')
  
        expect(dbClient.select).toHaveBeenCalledWith('users', { id: 'u1' })
        expect(result).toEqual(baseUser)
      })
  
      it('returns null when not found', async () => {
        dbClient.select.mockResolvedValue([])
  
        const result = await getUserById('missing')
  
        expect(result).toBeNull()
      })
    })
  
    // updateUserXP: updates the xp field for a specified user
    describe('updateUserXP()', () => {
      it('updates xp for a user and returns the updated record', async () => {
        const updated = { ...baseUser, xp: 25 }
        dbClient.update.mockResolvedValue(updated)
  
        const result = await updateUserXP('u1', 25)
  
        expect(dbClient.update).toHaveBeenCalledWith(
          'users',
          { id: 'u1' },
          { xp: 25 }
        )
        expect(result.xp).toBe(25)
      })
    })
  
    // updateUserStreak: updates the streak field for a specified user
    describe('updateUserStreak()', () => {
      it('updates streak for a user and returns the updated record', async () => {
        const updated = { ...baseUser, streak: 5 }
        dbClient.update.mockResolvedValue(updated)
  
        const result = await updateUserStreak('u1', 5)
  
        expect(dbClient.update).toHaveBeenCalledWith(
          'users',
          { id: 'u1' },
          { streak: 5 }
        )
        expect(result.streak).toBe(5)
      })
    })
  
    // addAchievement: appends a new achievement to the user's achievements array
    describe('addAchievement()', () => {
      it('adds an achievement and returns the updated record', async () => {
        const achievement = { type: 'DAILY_WARRIOR', timestamp: Date.now(), description: 'Test' }
        const updated = { ...baseUser, achievements: [achievement] }
        dbClient.update.mockResolvedValue(updated)
  
        const result = await addAchievement('u1', achievement)
  
        expect(dbClient.update).toHaveBeenCalledWith(
          'users',
          { id: 'u1' },
          { achievements: [achievement] }
        )
        expect(result.achievements).toContainEqual(achievement)
      })
    })
  
    // addCompletedTask: appends a completed task to the user's completedTasks array
    describe('addCompletedTask()', () => {
      it('adds a completed task and returns the updated record', async () => {
        const task = { taskId: 't1', completedAt: new Date().toISOString() }
        const updated = { ...baseUser, completedTasks: [task] }
        dbClient.update.mockResolvedValue(updated)
  
        const result = await addCompletedTask('u1', task)
  
        expect(dbClient.update).toHaveBeenCalledWith(
          'users',
          { id: 'u1' },
          { completedTasks: [task] }
        )
        expect(result.completedTasks).toContainEqual(task)
      })
    })
  })
  