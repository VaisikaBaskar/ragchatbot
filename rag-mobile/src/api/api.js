import axios from 'axios';
import CONFIG from '../config/config';

// 1. Axios Instance Configuration
const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// 2. JWT Token Handling Helper
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// 3. API Request functions
export const chatService = {
  // Send user message to chatbot API
  sendMessage: async (query) => {
    try {
      const response = await api.post(CONFIG.ENDPOINTS.CHAT, { query });
      return response.data; // { success: true, answer: "...", chatId: "..." }
    } catch (error) {
      console.error('Chat API Error:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post(CONFIG.ENDPOINTS.LOGIN, { email, password });
      return response.data; // { success: true, token: "...", data: {...} }
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  uploadDocument: async (fileUri, fileName, fileType) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });

      const response = await api.post(CONFIG.ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload API Error:', error);
      throw error;
    }
  }
};

export default api;
