import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AutoLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", userStr);
      window.location.href = "/dashboard";
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#135F80]">
      <div className="text-white text-xl animate-pulse">
        Securely connecting to your dashboard...
      </div>
    </div>
  );
};

export default AutoLogin;
