import api from './api';

export const commentService = {
  async getCommentsByTicket(ticketId) {
    const response = await api.get(`/comments/ticket/${ticketId}`);
    return response.data;
  },

  async addComment(commentData) {
    const response = await api.post('/comments', commentData);
    return response.data;
  }
};
