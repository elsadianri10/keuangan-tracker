import { ReactNode, useState } from "react";
import { LogOut , Menu, User , X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { menuItems } from "../routes/SidebarMenu";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const user = auth.currentUser;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error: any) {
      alert("Logout gagal: " + error.message);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-100 ${
          sidebarOpen ? "w-64" : "w-16"
        } transition-all duration-300 p-4 z-30`}
      >
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 right-4 md:hidden p-2 rounded transition-colors duration-200 hover:bg-gray-200"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>

        <h2
          className={`text-xl font-semibold mb-6 transition-all duration-300 ${
            sidebarOpen ? "block" : "hidden"
          }`}
        >
          My Finance Tracker
        </h2>

        <nav className="space-y-2 mt-10">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded hover:bg-gray-200 ${
                location.pathname === item.path
                  ? "bg-gray-300 font-semibold"
                  : ""
              } ${sidebarOpen ? "gap-3" : "justify-center"}`}
            >
              <span className="w-6 h-6 flex items-center justify-center">
                {item.icon}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* App Bar */}
      <div
        className={`fixed top-0 ${
          sidebarOpen ? "left-64" : "left-16"
        } right-0 h-16 bg-white shadow-md px-4 flex justify-between items-center transition-all duration-300 z-20`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:inline-block hidden"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
          <h1
            className="text-lg font-bold cursor-pointer"
            onClick={() => navigate("/")}
          >
            My Finance Tracker
          </h1>
        </div>
        {/* Button User */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 border rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <User className="w-6 h-6 text-gray-700" />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-md w-56 z-30">
              {/* Avatar + Email */}
              {user?.email && (
                <div className="flex flex-col items-center p-4 border-b">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    {user.email}
                  </p>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full text-center px-4 py-2 bg-red-600 text-white rounded-b-lg flex items-center justify-center gap-2 hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4 " />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div
        className={`pt-16 ${
          sidebarOpen ? "pl-64" : "pl-16"
        } transition-all duration-300`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
