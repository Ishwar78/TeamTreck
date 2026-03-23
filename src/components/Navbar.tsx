import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookDemoModal from "@/components/BookDemoModal";
import logo from "@/images/logo.png";
const features = [
  { label: "Time Tracker", href: "/features/time-tracker" },
  { label: "Team Management", href: "/features/team-management" },
  { label: "Screenshot Monitoring", href: "/features/screenshot-monitoring" },
  { label: "URL Tracking", href: "/features/url-tracking" },
];

const solutions = [
  { label: "Workforce Analytics", href: "/solutions/workforce-analytics" },
  { label: "Productivity Analytics", href: "/solutions/productivity-analytics" },
  { label: "Employee Monitoring", href: "/solutions/employee-monitoring" },
  { label: "Time Reporting", href: "/solutions/time-reporting" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDemo, setOpenDemo] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  if (isDashboard) return null;

  return (
    <>
      {/* 👉 BG WHITE */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">

          {/* 👉 LOGO IMAGE */}
          <Link to="/" className="flex items-center gap-2">
           <img
              src={logo}
              alt="logo"
              className="h-10 w-auto object-contain"
            />
            
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            <NavDropdown label="Features" items={features} />
            <NavDropdown label="Solutions" items={solutions} />

            <Link
              to="/pricing"
              className="text-sm text-black hover:text-primary transition-colors"
            >
              Pricing
            </Link>

            <Link
              to="/download"
              className="text-sm text-black hover:text-primary transition-colors"
            >
              Download
            </Link>

            <Link
              to="/contact"
              className="text-sm text-black hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="text-black">
                Login
              </Button>
            </Link>

            <Button size="sm">
              Book Demo
            </Button>
          </div>

          <button
            className="lg:hidden text-black"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">

                <Link
                  to="/pricing"
                  className="text-sm text-black py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Pricing
                </Link>

                <Link
                  to="/download"
                  className="text-sm text-black py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Download
                </Link>

                <Link
                  to="/contact"
                  className="text-sm text-black py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Contact
                </Link>

                <div className="flex gap-2 pt-2">
                  <Link to="/admin/login" className="flex-1">
                    <Button
                      variant="ghost"
                      className="w-full text-black"
                      size="sm"
                    >
                      Login
                    </Button>
                  </Link>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      setMobileOpen(false);
                      setOpenDemo(true);
                    }}
                  >
                    Book Demo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <BookDemoModal open={openDemo} setOpen={setOpenDemo} />
    </>
  );
};

const NavDropdown = ({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string }[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 text-sm text-black hover:text-primary transition-colors">
        {label} <ChevronDown size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full left-0 mt-2 w-48 rounded-lg bg-white shadow-md p-2"
          >
            {items.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block px-3 py-2 text-sm text-black hover:bg-gray-100 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;