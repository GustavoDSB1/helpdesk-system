import api from './api';

export const ticketService = {
  async getTickets(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/tickets?${params}`);
    return response.data;
  },

  async getTicketById(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  async createTicket(ticketData) {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  async updateTicket(id, ticketData) {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  async deleteTicket(id) {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  }
};
