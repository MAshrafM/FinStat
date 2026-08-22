// frontend/src/services/loginService.js
import { loginUser } from './authService';

export const login = async (username, password, options = {}) => {
  const data = await loginUser(username, password, options);
  return data;
};

const loginService = { login };

export default loginService;