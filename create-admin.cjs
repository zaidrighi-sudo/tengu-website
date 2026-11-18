const { MongoClient } = require('mongodb');

const DATABASE_URI = 'mongodb://anesrighi615_db_user:anes2014@ac-lx6fgfw-shard-00-00.aayhj7s.mongodb.net:27017,ac-lx6fgfw-shard-00-01.aayhj7s.mongodb.net:27017,ac-lx6fgfw-shard-00-02.aayhj7s.mongodb.net:27017/tengu?ssl=true&replicaSet=atlas-m0za0c-shard-0&authSource=admin';

async function createAdmin() {
  const client = new MongoClient(DATABASE_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('tengu'); // Using 'tengu' database as per our config

    // Check if admin already exists
    const existing = await db.collection('admins').findOne({ email: 'admin@tengu.com' });

    if (existing) {
      console.log('Admin user already exists:', existing.email);
      return;
    }

    // Create admin user
    const result = await db.collection('admins').insertOne({
      email: 'admin@tengu.com',
      password: 'admin123',  // In production, hash with bcrypt
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@tengu.com');
    console.log('Password: admin123');
    console.log('ID:', result.insertedId);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await client.close();
  }
}

createAdmin();