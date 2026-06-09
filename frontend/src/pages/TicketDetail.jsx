import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './TicketDetail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const [ticketData, commentsData] = await Promise.all([
        ticketService.getTicketById(id),
        commentService.getCommentsByTicket(id)
      ]);
      setTicket(ticketData);
      setComments(commentsData);
    } catch (error) {
      console.error('Erro ao carregar ticket:', error);
      alert('Erro ao carregar ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentService.addComment({
        ticket_id: parseInt(id),
        content: newComment,
        is_internal: isInternal
      });
      setNewComment('');
      setIsInternal(false);
      await loadTicketData();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await ticketService.updateTicket(id, { status: newStatus });
      await loadTicketData();
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este ticket?')) return;

    try {
      await ticketService.deleteTicket(id);
      alert('Ticket excluído com sucesso!');
      navigate('/tickets');
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      alert('Erro ao excluir ticket');
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
          <p>Carregando ticket...</p>
        </div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Navbar />
        <div className="error-container">
          <p>Ticket não encontrado</p>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')}>
            Voltar para Tickets
          </button>
        </div>
      </>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'technician' || ticket.user_id === user?.id;
  const canDelete = user?.role === 'admin' || ticket.user_id === user?.id;

  return (
    <>
      <Navbar />
      <div className="ticket-detail-container">
        <div className="ticket-detail-header">
          <button className="btn-back" onClick={() => navigate('/tickets')}>
            ← Voltar
          </button>
          <div className="ticket-actions">
            {canDelete && (
              <button className="btn btn-danger" onClick={handleDelete}>
                🗑️ Excluir
              </button>
            )}
          </div>
        </div>

        <div className="ticket-content">
          {/* Informações do Ticket */}
          <div className="ticket-info-card">
            <div className="ticket-info-header">
              <div>
                <span className="ticket-id">Ticket #{ticket.id}</span>
                <h1>{ticket.title}</h1>
              </div>
              <div className="ticket-badges">
                <span className={`badge ${getStatusBadge(ticket.status).class}`}>
                  {getStatusBadge(ticket.status).text}
                </span>
                <span className={`badge ${getPriorityBadge(ticket.priority).class}`}>
                  {getPriorityBadge(ticket.priority).text}
                </span>
              </div>
            </div>

            <div className="ticket-description">
              <h3>Descrição</h3>
              <p>{ticket.description}</p>
            </div>

            <div className="ticket-metadata">
              <div className="metadata-item">
                <strong>👤 Solicitante:</strong>
                <span>{ticket.user_name} ({ticket.user_email})</span>
              </div>
              <div className="metadata-item">
                <strong>📁 Categoria:</strong>
                <span>{ticket.category_name || 'Sem categoria'}</span>
              </div>
              {ticket.category_department && (
                <div className="metadata-item">
                  <strong>🏢 Departamento:</strong>
                  <span>{ticket.category_department}</span>
                </div>
              )}
              {ticket.assigned_name && (
                <div className="metadata-item">
                  <strong>👨‍💼 Atribuído a:</strong>
                  <span>{ticket.assigned_name}</span>
                </div>
              )}
              <div className="metadata-item">
                <strong>📅 Criado em:</strong>
                <span>{new Date(ticket.created_at).toLocaleString('pt-BR')}</span>
              </div>
              {ticket.resolved_at && (
                <div className="metadata-item">
                  <strong>✅ Resolvido em:</strong>
                  <span>{new Date(ticket.resolved_at).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>

            {/* Ações de Status */}
            {canEdit && (
              <div className="status-actions">
                <h3>Atualizar Status</h3>
                <div className="status-buttons">
                  {ticket.status !== 'in_progress' && (
                    <button 
                      className="btn btn-warning"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={updating}
                    >
                      ⚙️ Em Progresso
                    </button>
                  )}
                  {ticket.status !== 'resolved' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => handleStatusChange('resolved')}
                      disabled={updating}
                    >
                      ✅ Resolver
                    </button>
                  )}
                  {ticket.status !== 'closed' && ticket.status === 'resolved' && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleStatusChange('closed')}
                      disabled={updating}
                    >
                      🔒 Fechar
                    </button>
                  )}
                  {ticket.status !== 'open' && (
                    <button 
                      className="btn btn-info"
                      onClick={() => handleStatusChange('open')}
                      disabled={updating}
                    >
                      🔄 Reabrir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Comentários */}
          <div className="comments-section">
            <h2>💬 Comentários ({comments.length})</h2>

            {/* Lista de Comentários */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">Nenhum comentário ainda</p>
              ) : (
                comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className={`comment-card ${comment.is_internal ? 'comment-internal' : ''}`}
                  >
                    <div className="comment-header">
                      <div className="comment-author">
                        <strong>{comment.user_name}</strong>
                        <span className="comment-role">({comment.user_role})</span>
                      </div>
                      <div className="comment-meta">
                        {comment.is_internal && (
                          <span className="internal-badge">🔒 Interno</span>
                        )}
                        <span className="comment-date">
                          {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="comment-content">
                      {comment.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Adicionar Comentário */}
            <div className="add-comment-card">
              <h3>Adicionar Comentário</h3>
              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Digite seu comentário..."
                  rows="4"
                  required
                />
                
                {(user?.role === 'admin' || user?.role === 'technician') && (
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                      />
                      <span>Comentário interno (visível apenas para técnicos e admins)</span>
                    </label>
                  </div>
                )}

                <button type="submit" className="btn btn-primary">
                  📝 Adicionar Comentário
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetail;
