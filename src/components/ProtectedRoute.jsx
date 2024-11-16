import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = !!localStorage.getItem('auth_token');

    if (!isAuthenticated) {
        return <Navigate to="/loginDashboard" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;