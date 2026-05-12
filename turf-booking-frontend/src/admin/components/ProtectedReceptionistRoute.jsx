import { Navigate } from 'react-router-dom'

const ProtectedReceptionistRoute = ({ children }) => {
  const token = localStorage.getItem('receptionistToken')
  if (!token) return <Navigate to="/receptionist/login" replace />
  return children
}

export default ProtectedReceptionistRoute
