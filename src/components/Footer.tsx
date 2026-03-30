import { Link } from "react-router-dom";
import { Apple, Monitor, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

// ✅ IMPORT LOGO
import logo from "@/images/logo.png";

const Footer = () => (
  <footer className="text-white bg-[#0e2f3f]">
    <div className="container mx-auto px-6 py-16 max-w-7xl">

      <div className="grid md:grid-cols-5 gap-10">

        {/* Logo & CTA */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6">

            {/* ✅ LOGO IMAGE */}
            <img
              src={logo}
              alt="logo"
              className="h-10 w-auto object-contain"
            />

    
          </div>

          <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-sm">
            Thrilled to share that our team tracking and screen monitoring
            solutions have empowered countless businesses worldwide.
          </p>

          <Link to="/pricing">
            <button className="bg-white text-[#135F80] font-semibold px-6 py-3 rounded-full hover:scale-105 transition">
              Start Free Trial
            </button>
          </Link>

         
          {/* Social Icons */}
<div className="mt-8">
  <h4 className="font-semibold mb-3">Connect</h4>

  <div className="flex gap-4">

    {[
      { icon: Facebook, link: "https://www.facebook.com/" },
      { icon: Twitter, link: "" },
      { icon: Instagram, link: "https://instagram.com" },
      { icon: Linkedin, link: "https://linkedin.com" },
    ].map((item, i) => {
      const Icon = item.icon;

      return (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white hover:text-[#135F80] transition cursor-pointer"
        >
          <Icon size={16} />
        </a>
      );
    })}

  </div>
</div>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-semibold mb-4">Features</h4>
          <div className="flex flex-col gap-2 text-sm text-white/80">
            <Link to="/features/time-tracker">Time Tracker</Link>
            <Link to="/features/team-management">Team Management</Link>
            <Link to="/features/url-tracking">URL Tracking</Link>
            <Link to="/features/screenshot-monitoring">Screenshots</Link>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-white/80">
            <Link to="/contact">Contact Us</Link>
            <Link to="/help">Help Center</Link>
            <Link to="/privacypolicy">Privacy Policy</Link>
            <Link to="/About">About Us</Link>
          </div>
        </div>

        {/* Download */}
        <div>
          <h4 className="font-semibold mb-4">Download For</h4>

          <div className="flex flex-col gap-4">

            <Link to="/download">
              <button className="w-full flex items-center gap-3 bg-white text-[#135F80] px-5 py-3 rounded-full hover:scale-105 transition">
                <Apple size={18} />
                Get For <span className="font-bold">Mac OS</span>
              </button>
            </Link>

            <Link to="/download">
              <button className="w-full flex items-center gap-3 bg-white text-[#135F80] px-5 py-3 rounded-full hover:scale-105 transition">
                <Monitor size={18} />
                Get For <span className="font-bold">Windows</span>
              </button>
            </Link>

            <Link to="/download">
              <button className="w-full flex items-center gap-3 bg-white text-[#135F80] px-5 py-3 rounded-full hover:scale-105 transition">
                🐧
                Get For <span className="font-bold">Linux</span>
              </button>
            </Link>

          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/20 mt-12 pt-6 text-center text-sm text-white/70">
        © 2026 Multiclout. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;