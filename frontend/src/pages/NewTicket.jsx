import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { categoryService } from '../services/categoryService';
import Navbar from '../components/Navbar';
import './NewTicket.css';

const NewTicket = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined
      };

      const response = await ticketService.createTicket(dataToSend);
      alert('Ticket criado com sucesso!');
      navigate(`/tickets/${response.ticketId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="new-ticket-container">
        <div className="new-ticket-header">
          <button className="btn-back" onClick={() => navigate('/tickets')}>
            ← Voltar
          </button>
          <h1>Criar Novo Ticket</h1>
        </div>

        <div className="new-ticket-card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="ticket-form">
            <div className="form-group">
              <label htmlFor="title">Título *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Descreva brevemente o problema"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Descrição *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o problema em detalhes..."
                rows="6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Prioridade *</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category_id">Categoria</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} - {cat.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/tickets')}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Criando...' : '✅ Criar Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default NewTicket;
