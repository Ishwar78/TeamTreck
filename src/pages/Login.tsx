import { Navigate } from "react-router-dom";

/** Old /login route — redirect to the company admin login */
const Login = () => <Navigate to="/admin/login" replace />;

export default Login;
