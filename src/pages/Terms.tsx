import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const Terms = () => {
  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: "linear-gradient(to right, #135F80, #2C7862)" }}
    >
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full"
        >
          <div className="rounded-xl bg-gradient-card border border-border p-8">

            <h1 className="text-3xl font-bold text-center mb-6">
              Terms & Conditions
            </h1>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">

              <p>
                By accessing and using this system, you agree to comply with the
                following Terms and Conditions. These terms are designed to
                ensure transparency and proper usage of the platform.
              </p>

              <h2 className="text-lg font-semibold text-foreground">
                Activity Monitoring
              </h2>

              <p>
                The desktop agent associated with this platform may monitor
                certain activities on your device while you are logged in or
                working during designated work hours.
              </p>

              <ul className="list-disc ml-6 space-y-1">
                <li>Periodic screenshots of your screen.</li>
                <li>Tracking of websites accessed during work hours.</li>
                <li>Tracking of applications used on the device.</li>
                <li>Recording of work activity duration and productivity logs.</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground">
                Privacy Assurance
              </h2>

              <p>
                This system does <b>NOT</b> record microphone audio or personal
                voice data. Monitoring is limited to productivity-related
                information required for organizational purposes.
              </p>

              <h2 className="text-lg font-semibold text-foreground">
                Data Usage
              </h2>

              <p>
                The collected data is used strictly for:
              </p>

              <ul className="list-disc ml-6 space-y-1">
                <li>Work productivity analysis</li>
                <li>Security monitoring</li>
                <li>Company reporting purposes</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground">
                User Agreement
              </h2>

              <p>
                By continuing to use this platform and logging into your account,
                you acknowledge that you understand and agree to these monitoring
                policies.
              </p>

              <p className="text-xs text-muted-foreground pt-4">
                If you do not agree with these terms, please discontinue use of
                the system.
              </p>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;