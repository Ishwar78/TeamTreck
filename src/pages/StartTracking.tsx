import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import trackingImg from "@/images/start-tracking.png"; // 👈 apni image ka naam yaha set kar

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

const StartTracking = () => {
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #135F80, #2C7862)" }}
    >
   

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* LEFT CONTENT */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="max-w-xl"
            >
              <motion.h1
                variants={fadeUp}
                custom={0}
                className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              >
                Start Tracking Your Time With{" "}
                <span className="text-gradient">TeamTrack</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={1}
                className="text-white/90 mb-8 leading-relaxed"
              >
                Boost productivity with real-time monitoring, automated
                screenshots, detailed reports, and powerful team analytics —
                all in one secure platform.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={2}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/pricing">
                  <Button size="lg" className="px-8 shadow-glow">
                    Get Free
                  </Button>
                </Link>

                <Link to="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 border-white text-white hover:bg-white hover:text-primary"
                  >
                    14 Days Trial
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* RIGHT IMAGE */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="relative"
            >
              <div className="rounded-[40px] overflow-hidden shadow-glow ">
                <img
                  src={trackingImg}
                  alt="Start Tracking"
                  className="w-full object-cover"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      
    </div>
  );
};

export default StartTracking;