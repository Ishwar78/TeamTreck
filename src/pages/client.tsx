import { motion } from "framer-motion";
import { Star } from "lucide-react";

// 🔥 ADD AS MANY AS YOU WANT
const testimonials = [
  {
    name: "Rahul Mehta",
    role: "Founder, TechNova",
    feedback: "This platform completely transformed how we track remote teams.",
  },
  {
    name: "Priya Sharma",
    role: "HR Manager, WorkEdge",
    feedback: "The productivity reports help us optimize performance.",
  },
  {
    name: "Amit Verma",
    role: "CEO, DevSolutions",
    feedback: "Secure, reliable, and enterprise-ready system.",
  },
  {
    name: "Neha Kapoor",
    role: "Operations Head, ScaleUp",
    feedback: "Full transparency across departments.",
  },
  {
    name: "Rohit Sharma",
    role: "Project Manager, CodeLabs",
    feedback: "Managing remote developers is now simple.",
  },
  {
    name: "Anjali Verma",
    role: "Agency Owner, CreativeEdge",
    feedback: "Clients love the transparency and trust.",
  },
  {
    name: "Vikas Singh",
    role: "CTO, TechFlow",
    feedback: "Amazing tracking system with clean UI.",
  },
  {
    name: "Sneha Gupta",
    role: "Manager, BrightSoft",
    feedback: "Highly recommend for remote teams.",
  },
{
    name: "Deepak ",
    role: "Manager, BrightSoft",
    feedback: "Highly recommend for remote teams.",
  },
  {
    name: "Manu ",
    role: "Manager, BrightSoft",
    feedback: "Highly recommend for remote teams.",
  },
  {
    name: "Ishwar Sharma",
    role: "Manager, BrightSoft",
    feedback: "Highly recommend for remote teams.",
  },
  {
    name: "Antim",
    role: "Manager, BrightSoft",
    feedback: "Highly recommend for remote teams.",
  },









];

// 🔥 AUTO SPLIT (NO SAME CONTENT)
const mid = Math.ceil(testimonials.length / 2);
const topRow = testimonials.slice(0, mid);
const bottomRow = testimonials.slice(mid);

// 🔥 CARD
const Card = ({ t }: any) => (
  <div className="min-w-[300px] max-w-[300px] p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
    <div className="flex mb-4">
      {[...Array(5)].map((_, index) => (
        <Star key={index} size={16} className="text-primary fill-primary" />
      ))}
    </div>

    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
      "{t.feedback}"
    </p>

    <div>
      <h4 className="font-semibold text-foreground">{t.name}</h4>
      <p className="text-xs text-muted-foreground">{t.role}</p>
    </div>
  </div>
);

const Client = () => {
  return (
    <div
      className="min-h-screen text-white overflow-hidden"
      style={{
        background: "linear-gradient(to right, #135F80, #2C7862)",
      }}
    >
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4">

          {/* Heading */}
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              What Our <span className="text-gradient">Clients Say</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Trusted by startups, enterprises, agencies, and remote teams worldwide.
            </p>
          </div>

          {/* 🔥 TOP ROW (LEFT SCROLL) */}
          <div className="overflow-hidden mb-8">
            <motion.div
              className="flex gap-6"
              animate={{ x: ["0%", "-100%"] }}
              transition={{
                repeat: Infinity,
                duration: 25,
                ease: "linear",
              }}
            >
              {[...topRow, ...topRow, ...topRow].map((t, i) => (
                <Card key={i} t={t} />
              ))}
            </motion.div>
          </div>

          {/* 🔥 BOTTOM ROW (RIGHT SCROLL) */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{ x: ["-100%", "0%"] }}
              transition={{
                repeat: Infinity,
                duration: 25,
                ease: "linear",
              }}
            >
              {[...bottomRow, ...bottomRow, ...bottomRow].map((t, i) => (
                <Card key={i} t={t} />
              ))}
            </motion.div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Client;