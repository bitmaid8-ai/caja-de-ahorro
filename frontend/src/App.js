import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';

// Context for authentication
const AuthContext = createContext();

// API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const Login = () => {
  const { login, user } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(credentials.username, credentials.password);
    
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Caja de Ahorro RDS</h1>
          <p className="text-gray-600">Sistema de Gestión Cooperativa</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              data-testid="login-username-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              data-testid="login-password-input"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            data-testid="login-submit-btn"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Usuario por defecto: <strong>admin</strong></p>
          <p>Contraseña: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando estadísticas...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border" data-testid="total-members-card">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Socios</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_members || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border" data-testid="total-accounts-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Cuentas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_accounts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border" data-testid="total-savings-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Ahorros</p>
              <p className="text-2xl font-bold text-gray-900">${(stats?.total_savings || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border" data-testid="today-transactions-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transacciones Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.today_transactions || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors duration-200 text-left" data-testid="quick-member-btn">
            <h3 className="font-semibold text-emerald-700 mb-2">Gestión de Socios</h3>
            <p className="text-sm text-emerald-600">Registrar y administrar socios</p>
          </button>
          
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 text-left" data-testid="quick-account-btn">
            <h3 className="font-semibold text-blue-700 mb-2">Cuentas de Ahorro</h3>
            <p className="text-sm text-blue-600">Abrir cuentas y gestionar ahorros</p>
          </button>
          
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 text-left" data-testid="quick-transaction-btn">
            <h3 className="font-semibold text-purple-700 mb-2">Transacciones</h3>
            <p className="text-sm text-purple-600">Procesar depósitos y retiros</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Members Component
const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    identity_document: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: ''
  });

  useEffect(() => {
    fetchMembers();
  }, [searchTerm]);

  const fetchMembers = async () => {
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await axios.get('/members', { params });
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      identity_document: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      birth_date: ''
    });
    setEditingMember(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        birth_date: new Date(formData.birth_date).toISOString()
      };
      
      if (editingMember) {
        await axios.put(`/members/${editingMember.id}`, data);
      } else {
        await axios.post('/members', data);
      }
      
      setShowForm(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al procesar socio');
    }
  };

  const handleEdit = (member) => {
    setFormData({
      identity_document: member.identity_document,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      birth_date: new Date(member.birth_date).toISOString().split('T')[0]
    });
    setEditingMember(member);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Socios</h1>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          data-testid="add-member-btn"
        >
          {showForm ? 'Cancelar' : 'Nuevo Socio'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="member-form">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingMember ? 'Editar Socio' : 'Registrar Nuevo Socio'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.identity_document}
                onChange={(e) => setFormData({...formData, identity_document: e.target.value})}
                data-testid="member-identity-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                data-testid="member-firstname-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                data-testid="member-lastname-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="member-email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                data-testid="member-phone-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                data-testid="member-birthdate-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <textarea
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                data-testid="member-address-input"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                data-testid="submit-member-btn"
              >
                {editingMember ? 'Actualizar' : 'Registrar'} Socio
              </button>
              {editingMember && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <input
            type="text"
            placeholder="Buscar por número, cédula, nombre..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="member-search-input"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="members-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay socios registrados</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.member_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.identity_document}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.status === 'ACTIVO' ? 'bg-green-100 text-green-800' : 
                        member.status === 'INACTIVO' ? 'bg-gray-100 text-gray-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                        data-testid={`edit-member-${member.id}`}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Accounts Component
const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    account_type: 'CORRIENTE',
    initial_deposit: 0
  });

  useEffect(() => {
    fetchAccounts();
    fetchMembers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/accounts', {
        ...formData,
        initial_deposit: parseFloat(formData.initial_deposit)
      });
      setShowForm(false);
      setFormData({
        member_id: '',
        account_type: 'CORRIENTE',
        initial_deposit: 0
      });
      fetchAccounts();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al crear cuenta');
    }
  };

  const toggleAccountBlock = async (accountId, isBlocked) => {
    try {
      // This would need to be implemented in the backend
      console.log(`Toggle account ${accountId} block status to ${!isBlocked}`);
    } catch (error) {
      console.error('Error toggling account status:', error);
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Desconocido';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cuentas de Ahorro</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          data-testid="add-account-btn"
        >
          {showForm ? 'Cancelar' : 'Nueva Cuenta'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="account-form">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Abrir Nueva Cuenta</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Socio</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.member_id}
                onChange={(e) => setFormData({...formData, member_id: e.target.value})}
                data-testid="account-member-select"
              >
                <option value="">Seleccionar socio...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.member_number} - {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cuenta</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.account_type}
                onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                data-testid="account-type-select"
              >
                <option value="CORRIENTE">Corriente</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="NAVIDENO">Navideño</option>
                <option value="ESCOLAR">Escolar</option>
                <option value="AHORROS">Ahorros</option>
                <option value="FONDO_AYUDA_MUTUA">Fondo de Ayuda Mutua</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Depósito Inicial</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.initial_deposit}
                onChange={(e) => setFormData({...formData, initial_deposit: e.target.value})}
                data-testid="account-deposit-input"
              />
            </div>
            
            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                data-testid="submit-account-btn"
              >
                Abrir Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Lista de Cuentas</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="accounts-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número de Cuenta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay cuentas registradas</td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.account_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getMemberName(account.member_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.account_type === 'CORRIENTE' ? 'bg-blue-100 text-blue-800' :
                        account.account_type === 'AHORROS' ? 'bg-green-100 text-green-800' :
                        account.account_type === 'FONDO_AYUDA_MUTUA' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${account.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {account.is_blocked ? 'Bloqueada' : 'Activa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleAccountBlock(account.id, account.is_blocked)}
                        className={`mr-4 ${
                          account.is_blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                        }`}
                        data-testid={`toggle-account-${account.id}`}
                      >
                        {account.is_blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Transactions Component
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    transaction_type: 'DEPOSITO',
    amount: 0,
    description: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchMembers();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowForm(false);
      setFormData({
        account_id: '',
        transaction_type: 'DEPOSITO',
        amount: 0,
        description: ''
      });
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al procesar transacción');
    }
  };

  const getAccountInfo = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 'Desconocida';
    
    const member = members.find(m => m.id === account.member_id);
    const memberName = member ? `${member.first_name} ${member.last_name}` : 'Desconocido';
    
    return `${account.account_number} - ${memberName}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transacciones</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          data-testid="add-transaction-btn"
        >
          {showForm ? 'Cancelar' : 'Nueva Transacción'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="transaction-form">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Transacción</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.account_id}
                onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                data-testid="transaction-account-select"
              >
                <option value="">Seleccionar cuenta...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {getAccountInfo(account.id)} - ${account.balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Transacción</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.transaction_type}
                onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                data-testid="transaction-type-select"
              >
                <option value="DEPOSITO">Depósito</option>
                <option value="RETIRO">Retiro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                data-testid="transaction-amount-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                data-testid="transaction-description-input"
                placeholder="Descripción opcional..."
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                data-testid="submit-transaction-btn"
              >
                Procesar Transacción
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Libro Diario</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="transactions-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Después</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay transacciones registradas</td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getAccountInfo(transaction.account_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.transaction_type === 'DEPOSITO' ? 'bg-green-100 text-green-800' : 
                        transaction.transaction_type === 'RETIRO' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.balance_after.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Mutual Aid Component
const MutualAid = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    message: '',
    notification_type: 'SISTEMA'
  });
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    notification_type: 'SISTEMA'
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/notifications', formData);
      setShowForm(false);
      setFormData({
        user_id: '',
        title: '',
        message: '',
        notification_type: 'SISTEMA'
      });
      fetchNotifications();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al crear notificación');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/notifications/broadcast', null, {
        params: broadcastData
      });
      setShowBroadcastForm(false);
      setBroadcastData({
        title: '',
        message: '',
        notification_type: 'SISTEMA'
      });
      alert('Notificación enviada a todos los usuarios');
      fetchNotifications();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al enviar notificación');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              Tienes {unreadCount} notificacion{unreadCount > 1 ? 'es' : ''} sin leer
            </p>
          )}
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
          <div className=\"flex gap-2\">
            <button
              onClick={() => setShowForm(!showForm)}
              className=\"bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200\"
              data-testid=\"add-notification-btn\"
            >
              Nueva Notificación
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                className=\"bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200\"
                data-testid=\"broadcast-notification-btn\"
              >
                Enviar a Todos
              </button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className=\"bg-white p-6 rounded-xl shadow-sm border mb-6\" data-testid=\"notification-form\">
          <h2 className=\"text-xl font-bold text-gray-900 mb-4\">Nueva Notificación</h2>
          <form onSubmit={handleSubmit} className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Usuario Destinatario</label>
              <select
                required
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                value={formData.user_id}
                onChange={(e) => setFormData({...formData, user_id: e.target.value})}
              >
                <option value=\"\">Seleccionar usuario...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Tipo</label>
              <select
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                value={formData.notification_type}
                onChange={(e) => setFormData({...formData, notification_type: e.target.value})}
              >
                <option value=\"SISTEMA\">Sistema</option>
                <option value=\"TRANSACCION\">Transacción</option>
                <option value=\"ALERTA\">Alerta</option>
                <option value=\"CUENTA\">Cuenta</option>
                <option value=\"SOCIO\">Socio</option>
              </select>
            </div>
            
            <div className=\"md:col-span-2\">
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Título</label>
              <input
                type=\"text\"
                required
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className=\"md:col-span-2\">
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Mensaje</label>
              <textarea
                required
                rows={3}
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
            </div>
            
            <div className=\"md:col-span-2\">
              <button
                type=\"submit\"
                className=\"bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200\"
              >
                Enviar Notificación
              </button>
            </div>
          </form>
        </div>
      )}

      {showBroadcastForm && (
        <div className=\"bg-white p-6 rounded-xl shadow-sm border mb-6\" data-testid=\"broadcast-form\">
          <h2 className=\"text-xl font-bold text-gray-900 mb-4\">Enviar Notificación a Todos los Usuarios</h2>
          <form onSubmit={handleBroadcast} className=\"grid grid-cols-1 gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Tipo</label>
              <select
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent\"
                value={broadcastData.notification_type}
                onChange={(e) => setBroadcastData({...broadcastData, notification_type: e.target.value})}
              >
                <option value=\"SISTEMA\">Sistema</option>
                <option value=\"ALERTA\">Alerta</option>
                <option value=\"TRANSACCION\">Transacción</option>
              </select>
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Título</label>
              <input
                type=\"text\"
                required
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent\"
                value={broadcastData.title}
                onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">Mensaje</label>
              <textarea
                required
                rows={3}
                className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent\"
                value={broadcastData.message}
                onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
              />
            </div>
            
            <div>
              <button
                type=\"submit\"
                className=\"bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors duration-200\"
              >
                Enviar a Todos
              </button>
            </div>
          </form>
        </div>
      )}

      <div className=\"bg-white rounded-xl shadow-sm border\">
        <div className=\"p-6 border-b\">
          <h3 className=\"text-lg font-medium text-gray-900\">Mis Notificaciones</h3>
        </div>
        
        <div className=\"divide-y divide-gray-200\">
          {loading ? (
            <div className=\"p-6 text-center text-gray-500\">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className=\"p-6 text-center text-gray-500\">No hay notificaciones</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                  notification.status === 'NO_LEIDA' ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                }`}
              >
                <div className=\"flex items-start justify-between\">
                  <div className=\"flex-1\">
                    <div className=\"flex items-center gap-2 mb-2\">
                      <h4 className=\"font-medium text-gray-900\">{notification.title}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        notification.notification_type === 'SISTEMA' ? 'bg-gray-100 text-gray-800' :
                        notification.notification_type === 'ALERTA' ? 'bg-red-100 text-red-800' :
                        notification.notification_type === 'TRANSACCION' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.notification_type}
                      </span>
                      {notification.status === 'NO_LEIDA' && (
                        <span className=\"inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full\">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <p className=\"text-gray-700 mb-2\">{notification.message}</p>
                    <p className=\"text-sm text-gray-500\">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {notification.status === 'NO_LEIDA' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className=\"ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium\"
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
  const [aidRequests, setAidRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    member_id: '',
    amount: 0,
    reason: ''
  });
  const [contributionFormData, setContributionFormData] = useState({
    member_id: '',
    amount: 0
  });

  useEffect(() => {
    fetchAidRequests();
    fetchMembers();
  }, []);

  const fetchAidRequests = async () => {
    try {
      const response = await axios.get('/mutual-aid/requests');
      setAidRequests(response.data);
    } catch (error) {
      console.error('Error fetching aid requests:', error);
      setAidRequests([]); // Set empty array if endpoint doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/mutual-aid/requests', {
        ...requestFormData,
        amount: parseFloat(requestFormData.amount)
      });
      setShowRequestForm(false);
      setRequestFormData({ member_id: '', amount: 0, reason: '' });
      fetchAidRequests();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al crear solicitud');
    }
  };

  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/mutual-aid/contributions', null, {
        params: {
          member_id: contributionFormData.member_id,
          amount: parseFloat(contributionFormData.amount)
        }
      });
      setShowContributionForm(false);
      setContributionFormData({ member_id: '', amount: 0 });
      alert('Aporte registrado exitosamente');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al registrar aporte');
    }
  };

  const handleApproval = async (requestId, approved) => {
    try {
      if (approved) {
        await axios.put(`/mutual-aid/requests/${requestId}/approve`);
      } else {
        await axios.put(`/mutual-aid/requests/${requestId}/reject`);
      }
      fetchAidRequests();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al procesar solicitud');
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Desconocido';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fondo de Ayuda Mutua</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowContributionForm(!showContributionForm)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            data-testid="add-contribution-btn"
          >
            Registrar Aporte
          </button>
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            data-testid="add-request-btn"
          >
            Nueva Solicitud
          </button>
        </div>
      </div>

      {showContributionForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="contribution-form">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Aporte Mensual</h2>
          <form onSubmit={handleContributionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Socio</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={contributionFormData.member_id}
                onChange={(e) => setContributionFormData({...contributionFormData, member_id: e.target.value})}
              >
                <option value="">Seleccionar socio...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.member_number} - {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto del Aporte</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={contributionFormData.amount}
                onChange={(e) => setContributionFormData({...contributionFormData, amount: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Registrar Aporte
              </button>
            </div>
          </form>
        </div>
      )}

      {showRequestForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="request-form">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Solicitud de Ayuda</h2>
          <form onSubmit={handleRequestSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Socio</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={requestFormData.member_id}
                onChange={(e) => setRequestFormData({...requestFormData, member_id: e.target.value})}
              >
                <option value="">Seleccionar socio...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.member_number} - {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto Solicitado</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={requestFormData.amount}
                onChange={(e) => setRequestFormData({...requestFormData, amount: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de la Solicitud</label>
              <textarea
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={requestFormData.reason}
                onChange={(e) => setRequestFormData({...requestFormData, reason: e.target.value})}
                placeholder="Describa el motivo de la solicitud..."
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Solicitudes de Ayuda</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="aid-requests-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : aidRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay solicitudes registradas</td>
                </tr>
              ) : (
                aidRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getMemberName(request.member_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${request.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' : 
                        request.status === 'APROBADA' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'PENDIENTE' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproval(request.id, true)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleApproval(request.id, false)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Notifications Component
const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600 mt-2">Modulo de notificaciones del sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Mis Notificaciones</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay notificaciones</div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Security Component
const Security = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'CAJERO'
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/register', formData);
      setShowForm(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'CAJERO'
      });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al crear usuario');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h1>
          <p className="text-red-600">Solo los administradores pueden acceder al módulo de seguridad.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Seguridad del Sistema</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          data-testid="add-user-btn"
        >
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6" data-testid="user-form">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Usuario</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Usuario</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                data-testid="user-username-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="user-email-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                data-testid="user-fullname-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                data-testid="user-role-select"
              >
                <option value="CAJERO">Cajero</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="AUDITOR">Auditor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                data-testid="user-password-input"
                placeholder="Mínimo 6 caracteres"
                minLength="6"
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                data-testid="submit-user-btn"
              >
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Management */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center text-gray-500">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500">No hay usuarios para mostrar</div>
            ) : (
              <div className="space-y-4" data-testid="users-list">
                {users.map((userItem) => (
                  <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{userItem.full_name}</h4>
                      <p className="text-sm text-gray-500">@{userItem.username} • {userItem.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        userItem.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-800' :
                        userItem.role === 'AUDITOR' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {userItem.role}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        userItem.is_active ? 'bg-green-400' : 'bg-red-400'
                      }`}></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Información del Sistema</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Usuario Actual:</span>
                <span className="font-medium">{user.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rol:</span>
                <span className="font-medium">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Última Sesión:</span>
                <span className="font-medium">Ahora</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Versión del Sistema:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Usuarios:</span>
                <span className="font-medium">{users.length}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Permisos de Rol</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Acceso completo al sistema</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Gestión de usuarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Módulo de seguridad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Auditoría del sistema</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Audit Component
const Audit = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AUDITOR') {
      fetchAuditLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get('/audit-logs');
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'AUDITOR') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h1>
          <p className="text-red-600">Solo los administradores y auditores pueden acceder a los logs del sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
        <button
          onClick={fetchAuditLogs}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          data-testid="refresh-logs-btn"
        >
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE_MEMBER">Crear Socio</option>
              <option value="UPDATE_MEMBER">Actualizar Socio</option>
              <option value="CREATE_ACCOUNT">Crear Cuenta</option>
              <option value="CREATE_TRANSACTION">Transacción</option>
              <option value="CREATE_USER">Crear Usuario</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entidad</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              value={filters.entity_type}
              onChange={(e) => setFilters({...filters, entity_type: e.target.value})}
            >
              <option value="">Todas las entidades</option>
              <option value="Member">Socio</option>
              <option value="Account">Cuenta</option>
              <option value="Transaction">Transacción</option>
              <option value="User">Usuario</option>
              <option value="Notification">Notificación</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Registro de Auditoría</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="audit-logs-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Cargando logs...</td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay logs de auditoría</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      setUnreadNotifications(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { id: 'members', name: 'Socios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { id: 'accounts', name: 'Cuentas', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'transactions', name: 'Transacciones', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'mutual-aid', name: 'Fondo Mutua', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'notifications', name: 'Notificaciones', icon: 'M15 17h5l-3.5-7.5L12 17h3zm0 0v-3m0 3v-3m0 3h-6a2 2 0 00-2 2v1a2 2 0 002 2h6a2 2 0 002-2v-1a2 2 0 00-2-2z', badge: unreadNotifications },
    { id: 'notifications', name: 'Notificaciones', icon: 'M15 17h5l-3.5-7.5L12 17zm-3.5-9.5L7 17h5l2.5-9.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', badge: unreadNotifications }
  ];

  // Add Security module only for ADMIN users
  if (user?.role === 'ADMIN') {
    navigation.push({
      id: 'security', 
      name: 'Seguridad', 
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
    });
  }

  // Add Audit module for ADMIN and AUDITOR users
  if (user?.role === 'ADMIN' || user?.role === 'AUDITOR') {
    navigation.push({
      id: 'audit', 
      name: 'Auditoría', 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b" data-testid="app-header">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Caja de Ahorro RDS</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bienvenido, {user?.full_name}</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">{user?.role}</span>
              {unreadNotifications > 0 && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a8.97 8.97 0 001.5-5.5c0-5-4-9-9-9s-9 4-9 9a8.97 8.97 0 001.5 5.5L7 17h5" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                </button>
              )}
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 transition-colors duration-200"
                data-testid="logout-btn"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen" data-testid="app-sidebar">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'notifications') {
                        fetchUnreadCount();
                      }
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                      activeTab === item.id
                        ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    data-testid={`nav-${item.id}-btn`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1" data-testid="app-main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'members' && <Members />}
          {activeTab === 'accounts' && <Accounts />}
          {activeTab === 'transactions' && <Transactions />}
          {activeTab === 'mutual-aid' && <MutualAid />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'security' && <Security />}
          {activeTab === 'audit' && <Audit />}
        </main>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;