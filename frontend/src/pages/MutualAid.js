import React, { useState, useEffect } from 'react';
import axios from '../config/api';

const MutualAid = () => {
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

export default MutualAid;