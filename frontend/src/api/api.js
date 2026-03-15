import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api",
})

export default api

export const getStores = async () => {
  const response = await api.get("/stores")
  return response.data
}