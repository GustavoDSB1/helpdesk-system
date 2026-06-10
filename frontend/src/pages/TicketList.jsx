import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { categoryService } from '../services/categoryService';
import Navbar from '../components/Navbar';
import './TicketList.css';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category_id: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTickets(filters);
      setTickets(data);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category_id: ''
    });
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

  return (
    <>
      <Navbar />
      <div className="ticket-list-container">
        <div className="page-header">
          <h1>Meus Tickets</h1>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/new-ticket')}
          >
            ➕ Novo Ticket
          </button>
        </div>

        {/* Filtros */}
        <div className="filters-card">
          <h3>Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Status</label>
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Progresso</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Prioridade</label>
              <select 
                name="priority" 
                value={filters.priority} 
                onChange={handleFilterChange}
              >
                <option value="">Todas</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Categoria</label>
              <select 
                name="category_id" 
                value={filters.category_id} 
                onChange={handleFilterChange}
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>&nbsp;</label>
              <button 
                className="btn btn-secondary" 
                onClick={clearFilters}
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Tickets */}
        {loading ? (
          <div className="loading-container">
            <p>Carregando tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <p>📭 Nenhum ticket encontrado</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/new-ticket')}
            >
              Criar Novo Ticket
            </button>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                className="ticket-card"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="ticket-card-header">
                  <span className="ticket-id">#{ticket.id}</span>
                  <span className={`badge ${getStatusBadge(ticket.status).class}`}>
                    {getStatusBadge(ticket.status).text}
                  </span>
                </div>

                <h3 className="ticket-card-title">{ticket.title}</h3>
                <p className="ticket-card-description">
                  {ticket.description.substring(0, 100)}
                  {ticket.description.length > 100 ? '...' : ''}
                </p>

                <div className="ticket-card-footer">
                  <div className="ticket-meta">
                    <span className={`badge ${getPriorityBadge(ticket.priority).class}`}>
                      {getPriorityBadge(ticket.priority).text}
                    </span>
                    <span className="ticket-category">
                      📁 {ticket.category_name || 'Sem categoria'}
                    </span>
                  </div>
                  <span className="ticket-date">
                    {ticket.created_at}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TicketList;
