import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, BookOpen, LifeBuoy, Settings, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const categories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    desc: "Setup guide, installation steps, and onboarding instructions.",
  },
  {
    icon: Settings,
    title: "Account & Settings",
    desc: "Manage roles, permissions, company settings, and preferences.",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    desc: "Learn how we protect your data and maintain compliance.",
  },
  {
    icon: LifeBuoy,
    title: "Troubleshooting",
    desc: "Fix common issues with tracking, screenshots, and syncing.",
  },
];

const HelpCenter = () => {
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #135F80, #2C7862)" }}
    >
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Heading */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Help{" "}
              <span className="text-gradient">Center</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-white/90 mb-8 max-w-2xl mx-auto"
            >
              Find answers, guides, and resources to get the most out of
              WebMokTeamTrack.
            </motion.p>

            {/* Search Bar */}
            {/* <motion.div
              variants={fadeUp}
              custom={2}
              className="relative max-w-xl mx-auto"
            >
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
              />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-card border border-border text-white placeholder:text-white/50 focus:outline-none focus:border-primary"
              />
            </motion.div> */}
          </motion.div>

          {/* Categories */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 transition-all duration-300 hover:shadow-glow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <cat.icon size={24} className="text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {cat.title}
                </h3>

                <p className="text-white/80 text-sm leading-relaxed">
                  {cat.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Contact Support CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={3}
            className="bg-card border border-border rounded-2xl p-12 text-center shadow-glow"
          >
            <MessageCircle size={36} className="text-primary mx-auto mb-4" />

            <h2 className="text-3xl font-bold mb-4">
              Still Need Help?
            </h2>

            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Our support team is ready to assist you with any technical or
              account-related questions.
            </p>

            <Link to="/contact">
              <Button size="lg" className="shadow-glow">
                Contact Support
              </Button>
            </Link>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;