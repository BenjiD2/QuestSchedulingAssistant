// Test script to verify MongoDB connection and create a test user

require('dotenv').config();
const { connectToDatabase, disconnectFromDatabase } = require('./database/mongodb');
const UserModel = require('./database/models/User');
const TaskModel = require('./database/models/Task');
const UserProgressModel = require('./database/models/UserProgress');

async function testMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const connected = await connectToDatabase();
    
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB. Check your connection string.');
      return;
    }
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Create a test user
    const testUser = {
      userId: 'test-user-' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      xp: 100,
      level: 2
    };
    
    console.log('🔄 Creating test user:', testUser);
    
    // Create the user in MongoDB
    const user = new UserModel(testUser);
    await user.save();
    
    console.log('✅ Test user created successfully:', user);
    
    // Create user progress for the test user
    const userProgress = new UserProgressModel({
      userId: testUser.userId,
      xp: 100,
      level: 2,
      streak: 1
    });
    
    await userProgress.save();
    console.log('✅ User progress created successfully:', userProgress);
    
    // Create a test task
    const testTask = new TaskModel({
      taskId: 'task-' + Date.now(),
      userId: testUser.userId,
      title: 'Test Task',
      description: 'This is a test task created by the MongoDB test script',
      priority: 'medium',
      completed: false,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000), // 1 hour from now
      category: 'test'
    });
    
    await testTask.save();
    console.log('✅ Test task created successfully:', testTask);
    
    // Query for the user we just created
    const foundUser = await UserModel.findOne({ userId: testUser.userId });
    console.log('✅ Found the user we created:', foundUser ? 'Yes' : 'No');
    
    // Query for tasks
    const tasks = await TaskModel.find({});
    console.log(`✅ Found ${tasks.length} tasks in the database`);
    
    // Disconnect from MongoDB
    await disconnectFromDatabase();
    console.log('✅ Successfully disconnected from MongoDB');
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error testing MongoDB:', error);
  }
}

// Run the test
testMongoDB().catch(console.error); 