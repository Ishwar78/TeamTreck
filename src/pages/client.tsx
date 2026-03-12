import { motion } from "framer-motion";
import { Star } from "lucide-react";


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const testimonials = [
  {
    name: "Rahul Mehta",
    role: "Founder, TechNova",
    feedback:
      "This platform completely transformed how we track remote teams. Screenshots and real-time tracking are extremely accurate.",
  },
  {
    name: "Priya Sharma",
    role: "HR Manager, WorkEdge",
    feedback:
      "The productivity reports and idle detection help us optimize performance without micromanaging employees.",
  },
  {
    name: "Amit Verma",
    role: "CEO, DevSolutions",
    feedback:
      "Secure, reliable, and enterprise-ready. The desktop agent runs silently and syncs data instantly.",
  },
  {
    name: "Neha Kapoor",
    role: "Operations Head, ScaleUp",
    feedback:
      "TeamTrack gives us full transparency across departments. Reports are detailed and extremely helpful.",
  },
  {
    name: "Rohit Sharma",
    role: "Project Manager, CodeLabs",
    feedback:
      "Managing remote developers is now simple. URL tracking and screenshot logs are game changers.",
  },
  {
    name: "Anjali Verma",
    role: "Agency Owner, CreativeEdge",
    feedback:
      "Clients love the proof-of-work transparency. It has improved trust and billing clarity significantly.",
  },
];

const Client = () => {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to right, #135F80, #2C7862)",
      }}
    >
     

      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              What Our <span className="text-gradient">Clients Say</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Trusted by startups, enterprises, agencies, and remote teams worldwide.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      className="text-primary fill-primary"
                    />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  "{t.feedback}"
                </p>

                <div>
                  <h4 className="font-semibold text-foreground">
                    {t.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

     
    </div>
  );
};

export default Client;