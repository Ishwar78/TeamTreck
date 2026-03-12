import { motion } from "framer-motion";
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

const PrivacyPolicy = () => {
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #135F80, #2C7862)" }}
    >
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">

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
              Privacy{" "}
              <span className="text-gradient">Policy</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-white/90"
            >
              Your privacy is important to us. This Privacy Policy explains how
              WebMokTeamTrack collects, uses, and protects your information.
            </motion.p>
          </motion.div>

          {/* Content Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="bg-card border border-border rounded-2xl p-10 space-y-10 shadow-glow"
          >

            {/* Section 1 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                1. Information We Collect
              </h2>
              <p className="text-white/90 leading-relaxed">
                We may collect personal information such as name, email
                address, company details, and usage data when you use our
                platform. This includes time tracking records, activity logs,
                and system performance data.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                2. How We Use Your Information
              </h2>
              <p className="text-white/90 leading-relaxed">
                We use the collected data to provide, maintain, and improve
                our services, generate productivity reports, ensure platform
                security, and communicate important updates.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                3. Data Protection & Security
              </h2>
              <p className="text-white/90 leading-relaxed">
                All data is encrypted in transit and at rest. We use strict
                multi-tenant data isolation to ensure that each company’s data
                remains secure and separate from others.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                4. Data Sharing
              </h2>
              <p className="text-white/90 leading-relaxed">
                We do not sell, rent, or trade your personal data. Information
                may only be shared with trusted service providers who help us
                operate our platform securely.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                5. Cookies & Tracking Technologies
              </h2>
              <p className="text-white/90 leading-relaxed">
                We may use cookies and similar technologies to enhance user
                experience, analyze performance, and improve our services.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                6. Your Rights
              </h2>
              <p className="text-white/90 leading-relaxed">
                You have the right to access, update, or delete your personal
                information. For any privacy-related concerns, you can contact
                our support team.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                7. Changes to This Policy
              </h2>
              <p className="text-white/90 leading-relaxed">
                We may update this Privacy Policy from time to time. Any
                changes will be posted on this page with an updated revision
                date.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                8. Contact Us
              </h2>
              <p className="text-white/90 leading-relaxed">
                If you have any questions regarding this Privacy Policy,
                please contact us at:
              </p>
              <p className="text-white font-semibold mt-3">
                support@webmokteamtrack.com
              </p>
            </div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;