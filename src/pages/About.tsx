import { motion } from "framer-motion";
import { Users, Target, ShieldCheck, BarChart3, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

const values = [
  {
    icon: Target,
    title: "Our Mission",
    desc: "To empower businesses with smart productivity tools that provide transparency and efficiency without micromanagement."
  },
  {
    icon: Users,
    title: "Team First",
    desc: "We build solutions designed for real teams. Collaboration, trust, and productivity are at the heart of TeamTreck."
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "All tracking data and activity insights are protected with secure infrastructure and strict access controls."
  },
  {
    icon: BarChart3,
    title: "Insight Driven",
    desc: "Detailed analytics and reports help organizations make better productivity decisions."
  }
];

const About = () => {
  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-5xl font-bold mb-6"
          >
            About TeamTreck
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-lg text-white/80"
          >
            TeamTreck by Webmok is a powerful employee productivity and time
            tracking platform designed to help organizations manage remote and
            in-office teams efficiently. Our platform provides real-time
            insights, smart analytics, and automated tracking tools to improve
            team productivity and transparency.
          </motion.p>

        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
          >
            <h2 className="text-4xl font-bold mb-6">
              Built for Modern Teams
            </h2>

            <p className="text-white/80 leading-relaxed mb-4">
              As businesses move toward remote and hybrid work environments,
              managing productivity becomes increasingly challenging. TeamTreck
              was built to provide organizations with transparent insights into
              team performance while maintaining trust and efficiency.
            </p>

            <p className="text-white/80 leading-relaxed">
              With automated time tracking, activity insights, and detailed
              reporting, TeamTreck allows businesses to focus on results rather
              than manual supervision.
            </p>

          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
           className="bg-gradient-card border border-border rounded-3xl p-8 text-center hover:shadow-glow transition-all duration-300"
          >
            <Clock size={50} className="mb-6 text-white" />

            <h3 className="text-2xl font-semibold mb-4">
              Smarter Time Tracking
            </h3>

            <p className="text-white/80">
              Automatic time tracking, productivity analytics, and team
              monitoring tools help managers understand how work gets done
              without disrupting employees’ workflow.
            </p>

          </motion.div>

        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            className="text-4xl font-bold text-center mb-16"
          >
            Our Core Values
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            {values.map((value, i) => (
              <motion.div
                key={value.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
           className="bg-gradient-card border border-border rounded-3xl p-8 text-center hover:shadow-glow transition-all duration-300"
              >

                <div className="flex justify-center mb-6">
                  <value.icon size={36} />
                </div>

                <h3 className="text-xl font-semibold mb-4">
                  {value.title}
                </h3>

                <p className="text-white/80 text-sm leading-relaxed">
                  {value.desc}
                </p>

              </motion.div>
            ))}

          </div>

        </div>
      </section>

      {/* Why Choose */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            className="text-4xl font-bold mb-6"
          >
            Why Businesses Choose TeamTreck
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={1}
            className="text-white/80 leading-relaxed"
          >
            TeamTreck helps organizations improve accountability, enhance
            productivity, and gain complete visibility into how work is being
            done. Whether managing a remote workforce or an in-office team,
            our platform provides the tools needed to make better productivity
            decisions.
          </motion.p>

        </div>
      </section>


      <Footer />

    </div>
  );
};

export default About;