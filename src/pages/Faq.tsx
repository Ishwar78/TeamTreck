import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


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

const faqs = [
  {
    question: "What is WebMokTeamTrack?",
    answer:
      "WebMokTeamTrack is a powerful time-tracking software designed to help teams, businesses, and freelancers efficiently manage work hours with real-time tracking and detailed reports.",
  },
  {
    question: "Who can use WebMokTeamTrack?",
    answer:
      "WebMokTeamTrack is ideal for startups, enterprises, remote teams, freelancers, agencies, and growing companies.",
  },
  {
    question: "Does WebMokTeamTrack provide reports?",
    answer:
      "Yes, WebMokTeamTrack provides detailed daily, weekly, and monthly productivity reports with export options.",
  },
  {
    question: "How much does WebMokTeamTrack cost?",
    answer:
      "We offer flexible pricing plans based on team size. You can start with a free trial.",
  },
  {
    question: "What if I face issues with time tracking?",
    answer:
      "Our support team is available to help you with any technical or tracking-related concerns.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #135F80, #2C7862)" }}
    >
    

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-glow opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* LEFT SIDE */}
            <div>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                Frequently Asked <span className="text-gradient">Questions</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                custom={1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-white/90 leading-relaxed mb-8"
              >
                WebMokTeamTrack helps teams, businesses, and freelancers efficiently manage
                work hours with real-time tracking, reports, and seamless collaboration.
              </motion.p>

              <Link to="/contact">
                <Button size="lg" className="shadow-glow">
                  Contact Us
                </Button>
              </Link>
            </div>

            {/* RIGHT SIDE ACCORDION */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={index}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                    className="w-full flex justify-between items-center p-5 text-left font-semibold text-white"
                  >
                    {faq.question}
                    <span className="text-xl">
                      {openIndex === index ? "−" : "+"}
                    </span>
                  </button>

                  {openIndex === index && (
                    <div className="px-5 pb-5 text-sm text-white/80">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default FAQ;