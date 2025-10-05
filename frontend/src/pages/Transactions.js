import React, { useState, useEffect } from 'react';
import axios from '../config/api';

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

export default Transactions;