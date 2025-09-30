#!/usr/bin/env python3

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone
import hashlib

# Add the backend directory to the Python path
sys.path.append('/app/backend')

async def create_admin_user():
    # MongoDB connection
    mongo_url = "mongodb://localhost:27017" 
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    # Check if admin user already exists
    admin_user = await db.users.find_one({"username": "admin"})
    
    if admin_user:
        print("Admin user already exists")
        print(f"Admin user data: {admin_user}")
        return
    
    # Create admin user
    SECRET_KEY = 'your-secret-key-change-in-production'
    password_hash = hashlib.sha256(f"admin123{SECRET_KEY}".encode()).hexdigest()
    
    default_admin = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "email": "admin@cajardsystem.com", 
        "full_name": "Administrador Sistema",
        "role": "ADMIN",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "password": password_hash
    }
    
    await db.users.insert_one(default_admin)
    print("Default admin user created successfully!")
    print(f"Username: admin")
    print(f"Password: admin123")
    print(f"Password hash: {password_hash}")
    
    # Verify creation
    admin_user = await db.users.find_one({"username": "admin"})
    if admin_user:
        print(f"Verification: Admin user found in database with id: {admin_user['id']}")
    else:
        print("ERROR: Admin user not found after creation")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())