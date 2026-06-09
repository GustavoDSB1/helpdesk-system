import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const tickets = await ticketService.getTickets();
      
      // Calcular estatísticas
      const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
      };

      setStats(stats);
      setRecentTickets(tickets.slice(0, 5)); // Últimos 5 tickets
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { text: 'Aberto', class: 'badge-open' },
      in_progress: { text: 'Em Progresso', class: 'badge-progress' },
      resolved: { text: 'Resolvido', class: 'badge-resolved' },
      closed: { text: 'Fechado', class: 'badge-closed' }
    };
    return badges[status] || { text: status, class: '' };
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { text: 'Baixa', class: 'priority-low' },
      medium: { text: 'Média', class: 'priority-medium' },
      high: { text: 'Alta', class: 'priority-high' },
      urgent: { text: 'Urgente', class: 'priority-urgent' }
    };
    return badges[priority] || { text: priority, class: '' };
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <p>Carregando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Bem-vindo, {user?.name}!</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total de Tickets</p>
            </div>
          </div>

          <div className="stat-card stat-open">
            <div className="stat-icon">🆕</div>
            <div className="stat-info">
              <h3>{stats.open}</h3>
              <p>Abertos</p>
            </div>
          </div>

          <div className="stat-card stat-progress">
            <div className="stat-icon">⚙️</div>
            <div className="stat-info">
              <h3>{stats.inProgress}</h3>
              <p>Em Progresso</p>
            </div>
          </div>

          <div className="stat-card stat-resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.resolved}</h3>
              <p>Resolvidos</p>
            </div>
          </div>
        </div>

        {/* Tickets Recentes */}
        <div className="recent-tickets">
          <div className="section-header">
            <h2>Tickets Recentes</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/tickets')}
            >
              Ver Todos
            </button>
          </div>

          {recentTickets.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum ticket encontrado</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/new-ticket')}
              >
                Criar Primeiro Ticket
              </button>
            </div>
          ) : (
            <div className="tickets-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td className="ticket-title">{ticket.title}</td>
                      <td>{ticket.category_name || 'Sem categoria'}</td>
                      <td>
                        <span className={`badge ${getPriorityBadge(ticket.priority).class}`}>
                          {getPriorityBadge(ticket.priority).text}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(ticket.status).class}`}>
                          {getStatusBadge(ticket.status).text}
                        </span>
                      </td>
                      <td>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          title="Ver detalhes"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
