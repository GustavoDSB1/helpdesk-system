import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  // Buscar todos os usuários (admin)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar técnicos (para atribuição)
  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/users/technicians');
      setTechnicians(response.data);
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      throw error;
    }
  };

  // Atualizar role do usuário
  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      throw error;
    }
  };

  // Deletar usuário
  const deleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      await fetchUsers(); // Recarregar lista
      return true;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        technicians,
        loading,
        fetchUsers,
        fetchTechnicians,
        updateUserRole,
        deleteUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers deve ser usado dentro de UserProvider');
  }
  return context;
};
