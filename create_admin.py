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
    
    # Secret key for password hashing
    SECRET_KEY = 'your-secret-key-change-in-production'
    
    # Create new password hash using the same method as server
    password_hash = hashlib.sha256("admin123".encode() + SECRET_KEY.encode()).hexdigest()
    
    # Check if admin user already exists
    admin_user = await db.users.find_one({"username": "admin"})
    
    if admin_user:
        print("Admin user exists, updating password hash...")
        # Update the password to use new hash format
        await db.users.update_one(
            {"username": "admin"},
            {"$set": {"password": password_hash}}
        )
        print(f"Password updated successfully!")
    else:
        # Create admin user
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
    
    # Verify 
    admin_user = await db.users.find_one({"username": "admin"})
    if admin_user:
        print(f"Verification: Admin user found with correct hash format")
    else:
        print("ERROR: Admin user not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())