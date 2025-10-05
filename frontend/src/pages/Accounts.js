import React, { useState, useEffect } from 'react';
import axios from '../config/api';

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

export default Accounts;