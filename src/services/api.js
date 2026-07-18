import axios from "axios";

const BASE_URL = "http://10.59.250.69:3000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;