from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from enum import Enum
import json
from bson import ObjectId
import hashlib
import hmac

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app
app = FastAPI(title="Caja de Ahorro RDS API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    CAJERO = "CAJERO"
    AUDITOR = "AUDITOR"

class MemberStatus(str, Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"
    SUSPENDIDO = "SUSPENDIDO"

class AccountType(str, Enum):
    CORRIENTE = "CORRIENTE"
    PROGRAMADO = "PROGRAMADO"
    NAVIDENO = "NAVIDENO"
    ESCOLAR = "ESCOLAR"

class TransactionType(str, Enum):
    DEPOSITO = "DEPOSITO"
    RETIRO = "RETIRO"
    APERTURA = "APERTURA"
    APORTE_MUTUA = "APORTE_MUTUA"
    AYUDA_MUTUA = "AYUDA_MUTUA"

class AidRequestStatus(str, Enum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Member(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_number: str
    identity_document: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: str
    birth_date: datetime
    status: MemberStatus = MemberStatus.ACTIVO
    registration_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    documents: List[str] = []

class MemberCreate(BaseModel):
    identity_document: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: str
    birth_date: datetime

class Account(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_number: str
    member_id: str
    account_type: AccountType
    balance: float = 0.0
    is_blocked: bool = False
    minimum_balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountCreate(BaseModel):
    member_id: str
    account_type: AccountType
    initial_deposit: float

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference: str
    account_id: str
    member_id: str
    transaction_type: TransactionType
    amount: float
    balance_before: float
    balance_after: float
    description: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    account_id: str
    transaction_type: TransactionType
    amount: float
    description: Optional[str] = ""

class MutualAidContribution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    amount: float
    month: int
    year: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AidRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    amount: float
    reason: str
    status: AidRequestStatus = AidRequestStatus.PENDIENTE
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None

class AidRequestCreate(BaseModel):
    member_id: str
    amount: float
    reason: str

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    old_data: Optional[dict] = None
    new_data: Optional[dict] = None
    ip_address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Utility functions
def verify_password(plain_password, hashed_password):
    # Using SHA-256 with salt for password verification
    return hmac.compare_digest(
        hashlib.sha256(plain_password.encode() + SECRET_KEY.encode()).hexdigest(),
        hashed_password
    )

def get_password_hash(password):
    # Using SHA-256 with salt for password hashing
    return hashlib.sha256(password.encode() + SECRET_KEY.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return User(**user)

async def log_action(user_id: str, action: str, entity_type: str, entity_id: str, old_data=None, new_data=None, ip_address="127.0.0.1"):
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address
    )
    await db.audit_logs.insert_one(log_entry.dict())

async def generate_member_number():
    current_year = datetime.now().year
    count = await db.members.count_documents({}) + 1
    return f"SOCIO-{current_year}-{count:05d}"

async def generate_account_number(account_type: AccountType):
    type_prefix = {
        AccountType.CORRIENTE: "CC",
        AccountType.PROGRAMADO: "AP", 
        AccountType.NAVIDENO: "AN",
        AccountType.ESCOLAR: "AE"
    }
    count = await db.accounts.count_documents({"account_type": account_type}) + 1
    return f"{type_prefix[account_type]}-{count:08d}"

async def generate_transaction_reference():
    count = await db.transactions.count_documents({}) + 1
    return f"TXN-{datetime.now().strftime('%Y%m%d')}-{count:06d}"

# Authentication endpoints
@api_router.post("/auth/register", response_model=User)
async def register(user: UserCreate, current_user: User = Depends(get_current_user)):
    # Only admins can create users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict.pop('password')
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    user_data = user_obj.dict()
    user_data['password'] = hashed_password
    await db.users.insert_one(user_data)
    
    await log_action(current_user.id, "CREATE_USER", "User", user_obj.id)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: UserLogin):
    user = await db.users.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user['is_active']:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_obj
    }

@api_router.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Members endpoints
@api_router.post("/members", response_model=Member)
async def create_member(member: MemberCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check duplicates
    existing = await db.members.find_one({"$or": [{"identity_document": member.identity_document}, {"email": member.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Member with this identity or email already exists")
    
    member_number = await generate_member_number()
    member_dict = member.dict()
    member_obj = Member(**member_dict, member_number=member_number)
    
    await db.members.insert_one(member_obj.dict())
    await log_action(current_user.id, "CREATE_MEMBER", "Member", member_obj.id)
    
    return member_obj

@api_router.get("/members", response_model=List[Member])
async def get_members(skip: int = 0, limit: int = 100, search: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if search:
        query = {
            "$or": [
                {"member_number": {"$regex": search, "$options": "i"}},
                {"identity_document": {"$regex": search, "$options": "i"}},
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}}
            ]
        }
    
    members = await db.members.find(query).skip(skip).limit(limit).to_list(limit)
    return [Member(**member) for member in members]

@api_router.get("/members/{member_id}", response_model=Member)
async def get_member(member_id: str, current_user: User = Depends(get_current_user)):
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return Member(**member)

@api_router.put("/members/{member_id}", response_model=Member)
async def update_member(member_id: str, member_update: MemberCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    existing = await db.members.find_one({"id": member_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Member not found")
    
    old_data = existing.copy()
    update_data = member_update.dict()
    
    result = await db.members.update_one({"id": member_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    updated_member = await db.members.find_one({"id": member_id})
    await log_action(current_user.id, "UPDATE_MEMBER", "Member", member_id, old_data, update_data)
    
    return Member(**updated_member)

# Accounts endpoints
@api_router.post("/accounts", response_model=Account)
async def create_account(account: AccountCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify member exists
    member = await db.members.find_one({"id": account.member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Check if member already has this type of account
    existing_account = await db.accounts.find_one({
        "member_id": account.member_id,
        "account_type": account.account_type
    })
    if existing_account:
        raise HTTPException(status_code=400, detail="Member already has this type of account")
    
    # Validate minimum deposit
    minimum_deposits = {
        AccountType.CORRIENTE: 1000,
        AccountType.PROGRAMADO: 5000,
        AccountType.NAVIDENO: 2000,
        AccountType.ESCOLAR: 1000
    }
    
    if account.initial_deposit < minimum_deposits[account.account_type]:
        raise HTTPException(status_code=400, detail=f"Minimum deposit for {account.account_type} is {minimum_deposits[account.account_type]}")
    
    account_number = await generate_account_number(account.account_type)
    account_obj = Account(
        account_number=account_number,
        member_id=account.member_id,
        account_type=account.account_type,
        balance=account.initial_deposit,
        minimum_balance=minimum_deposits[account.account_type]
    )
    
    await db.accounts.insert_one(account_obj.dict())
    
    # Create opening transaction
    reference = await generate_transaction_reference()
    transaction = Transaction(
        reference=reference,
        account_id=account_obj.id,
        member_id=account.member_id,
        transaction_type=TransactionType.APERTURA,
        amount=account.initial_deposit,
        balance_before=0,
        balance_after=account.initial_deposit,
        description=f"Apertura de cuenta {account.account_type}",
        created_by=current_user.id
    )
    
    await db.transactions.insert_one(transaction.dict())
    await log_action(current_user.id, "CREATE_ACCOUNT", "Account", account_obj.id)
    
    return account_obj

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(member_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if member_id:
        query["member_id"] = member_id
    
    accounts = await db.accounts.find(query).to_list(1000)
    return [Account(**account) for account in accounts]

# Transactions endpoints
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get account
    account = await db.accounts.find_one({"id": transaction.account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account['is_blocked']:
        raise HTTPException(status_code=400, detail="Account is blocked")
    
    balance_before = account['balance']
    
    # Validate transaction
    if transaction.transaction_type == TransactionType.RETIRO:
        if balance_before < transaction.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        balance_after = balance_before - transaction.amount
    else:  # DEPOSITO
        balance_after = balance_before + transaction.amount
    
    # Create transaction
    reference = await generate_transaction_reference()
    transaction_obj = Transaction(
        reference=reference,
        account_id=transaction.account_id,
        member_id=account['member_id'],
        transaction_type=transaction.transaction_type,
        amount=transaction.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        description=transaction.description or f"{transaction.transaction_type} - {transaction.amount}",
        created_by=current_user.id
    )
    
    # Update account balance
    await db.accounts.update_one(
        {"id": transaction.account_id},
        {"$set": {"balance": balance_after}}
    )
    
    await db.transactions.insert_one(transaction_obj.dict())
    await log_action(current_user.id, "CREATE_TRANSACTION", "Transaction", transaction_obj.id)
    
    return transaction_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(account_id: Optional[str] = None, member_id: Optional[str] = None, skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    query = {}
    if account_id:
        query["account_id"] = account_id
    if member_id:
        query["member_id"] = member_id
    
    transactions = await db.transactions.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Transaction(**transaction) for transaction in transactions]

# Mutual Aid endpoints
@api_router.post("/mutual-aid/contributions")
async def create_contribution(member_id: str, amount: float, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify member exists
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    now = datetime.now(timezone.utc)
    contribution = MutualAidContribution(
        member_id=member_id,
        amount=amount,
        month=now.month,
        year=now.year
    )
    
    await db.mutual_aid_contributions.insert_one(contribution.dict())
    await log_action(current_user.id, "CREATE_CONTRIBUTION", "MutualAidContribution", contribution.id)
    
    return contribution

@api_router.post("/mutual-aid/requests", response_model=AidRequest)
async def create_aid_request(request: AidRequestCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.CAJERO]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify member exists and has 6 months minimum
    member = await db.members.find_one({"id": request.member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Check 6 months requirement
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    if datetime.fromisoformat(member['registration_date'].replace('Z', '+00:00')) > six_months_ago:
        raise HTTPException(status_code=400, detail="Member must have at least 6 months of membership")
    
    aid_request = AidRequest(
        member_id=request.member_id,
        amount=request.amount,
        reason=request.reason
    )
    
    await db.aid_requests.insert_one(aid_request.dict())
    await log_action(current_user.id, "CREATE_AID_REQUEST", "AidRequest", aid_request.id)
    
    return aid_request

@api_router.put("/mutual-aid/requests/{request_id}/approve")
async def approve_aid_request(request_id: str, notes: Optional[str] = None, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    aid_request = await db.aid_requests.find_one({"id": request_id})
    if not aid_request:
        raise HTTPException(status_code=404, detail="Aid request not found")
    
    update_data = {
        "status": AidRequestStatus.APROBADA,
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc),
        "notes": notes
    }
    
    await db.aid_requests.update_one({"id": request_id}, {"$set": update_data})
    await log_action(current_user.id, "APPROVE_AID_REQUEST", "AidRequest", request_id)
    
    return {"message": "Aid request approved"}

# Dashboard endpoints
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_members = await db.members.count_documents({"status": MemberStatus.ACTIVO})
    total_accounts = await db.accounts.count_documents({})
    
    # Calculate total savings
    pipeline = [
        {"$group": {"_id": None, "total_balance": {"$sum": "$balance"}}}
    ]
    total_savings_result = await db.accounts.aggregate(pipeline).to_list(1)
    total_savings = total_savings_result[0]['total_balance'] if total_savings_result else 0
    
    # Today's transactions
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_transactions = await db.transactions.count_documents({
        "created_at": {"$gte": today_start}
    })
    
    return {
        "total_members": total_members,
        "total_accounts": total_accounts,
        "total_savings": total_savings,
        "today_transactions": today_transactions
    }

# Audit endpoints
@api_router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    logs = await db.audit_logs.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [AuditLog(**log) for log in logs]

# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "Caja de Ahorro RDS API v1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Create default admin user if not exists
    admin_user = await db.users.find_one({"username": "admin"})
    if not admin_user:
        default_admin = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@cajardsystem.com",
            "full_name": "Administrador Sistema",
            "role": UserRole.ADMIN,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "password": get_password_hash("admin123")
        }
        await db.users.insert_one(default_admin)
        logger.info("Default admin user created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
