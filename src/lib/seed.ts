import { db } from './db';

export async function seedRooms() {
  const rooms = [
    // Building A
    { name: 'Standard Room', building: 'Building A', floor: 1, number: '101', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Standard Room', building: 'Building A', floor: 1, number: '102', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Standard Room', building: 'Building A', floor: 1, number: '103', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Single Room', building: 'Building A', floor: 1, number: '104', capacity: 1, description: 'Single room with private bathroom' },
    { name: 'Standard Room', building: 'Building A', floor: 2, number: '201', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Standard Room', building: 'Building A', floor: 2, number: '202', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Premium Room', building: 'Building A', floor: 2, number: '203', capacity: 2, description: 'Premium double room with private bathroom' },
    { name: 'Single Room', building: 'Building A', floor: 2, number: '204', capacity: 1, description: 'Single room with private bathroom' },
    
    // Building B
    { name: 'Standard Room', building: 'Building B', floor: 1, number: '101', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Standard Room', building: 'Building B', floor: 1, number: '102', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Suite', building: 'Building B', floor: 1, number: '103', capacity: 3, description: 'Three-person suite with kitchenette' },
    { name: 'Standard Room', building: 'Building B', floor: 2, number: '201', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Standard Room', building: 'Building B', floor: 2, number: '202', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Premium Room', building: 'Building B', floor: 2, number: '203', capacity: 2, description: 'Premium double room with private bathroom' },
    
    // Building C
    { name: 'Standard Room', building: 'Building C', floor: 1, number: '101', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Standard Room', building: 'Building C', floor: 1, number: '102', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Single Room', building: 'Building C', floor: 1, number: '103', capacity: 1, description: 'Single room with private bathroom' },
    { name: 'Standard Room', building: 'Building C', floor: 2, number: '201', capacity: 2, description: 'Standard double room with shared bathroom' },
    { name: 'Premium Room', building: 'Building C', floor: 2, number: '202', capacity: 2, description: 'Premium double room with private bathroom' },
    { name: 'Suite', building: 'Building C', floor: 2, number: '203', capacity: 3, description: 'Three-person suite with kitchenette' },
  ];

  for (const room of rooms) {
    await db.room.upsert({
      where: {
        building_floor_number: {
          building: room.building,
          floor: room.floor,
          number: room.number,
        },
      },
      update: {},
      create: room,
    });
  }

  console.log('Rooms seeded successfully');
}

// Run this to seed the database
if (require.main === module) {
  seedRooms()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding rooms:', error);
      process.exit(1);
    });
}