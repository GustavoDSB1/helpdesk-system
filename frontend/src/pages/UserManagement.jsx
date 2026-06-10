import React, { useEffect, useState } from 'react';
import { useUsers } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { 
  FaUserShield, 
  FaUserTie, 
  FaUser, 
  FaTrash, 
  FaEdit,
  FaCrown,
  FaTools
} from 'react-icons/fa';

const UserManagement = () => {
  const { users, loading, fetchUsers, updateUserRole, deleteUser } = useUsers();
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId) => {
    try {
      await updateUserRole(userId, selectedRole);
      alert('Role atualizada com sucesso!');
      setEditingUser(null);
    } catch (error) {
      alert('Erro ao atualizar role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      await deleteUser(userId);
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      alert('Erro ao deletar usuário');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-red-500" />;
      case 'technician':
        return <FaUserTie className="text-blue-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      technician: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      admin: 'Administrador',
      technician: 'Técnico',
      user: 'Usuário'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <FaCrown className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">Acesso Restrito</h2>
        <p className="text-gray-500 mt-2">Apenas administradores podem acessar esta página</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaUserShield className="text-blue-600" />
            Gerenciar Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            {users.length} usuários cadastrados
          </p>
        </div>
      </div>

      {/* Legenda de Roles */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Níveis de Acesso:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <FaCrown className="text-red-600 text-2xl" />
            <div>
              <p className="font-semibold text-red-800">Administrador</p>
              <p className="text-xs text-red-600">Acesso total ao sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <FaTools className="text-blue-600 text-2xl" />
            <div>
              <p className="font-semibold text-blue-800">Técnico</p>
              <p className="text-xs text-blue-600">Pode gerenciar todos os tickets</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FaUser className="text-gray-600 text-2xl" />
            <div>
              <p className="font-semibold text-gray-800">Usuário</p>
              <p className="text-xs text-gray-600">Pode criar e ver seus tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cadastro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.full_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  {editingUser === user.id ? (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-1 border rounded"
                    >
                      <option value="user">Usuário</option>
                      <option value="technician">Técnico</option>
                      <option value="admin">Administrador</option>
                    </select>
                  ) : (
                    getRoleBadge(user.role)
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingUser === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateRole(user.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingUser(user.id);
                            setSelectedRole(user.role);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar role"
                          disabled={user.id === currentUser.id}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deletar usuário"
                          disabled={user.id === currentUser.id}
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
