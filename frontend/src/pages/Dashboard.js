import React, { useState, useEffect } from 'react';
import axios from '../config/api';

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

export default Dashboard;