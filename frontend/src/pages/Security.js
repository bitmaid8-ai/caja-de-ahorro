import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/api';

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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Configuración de Seguridad</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Autenticación</h4>
              <p className="text-sm text-green-600">Sistema de autenticación JWT activo</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Encriptación</h4>
              <p className="text-sm text-blue-600">Contraseñas protegidas con SHA256</p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Auditoría</h4>
              <p className="text-sm text-yellow-600">Registro de actividades habilitado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;