import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const BookDemoModal = ({ open, setOpen }: Props) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organisation: "",
    message: ""
  });

  const API = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Name, Email and Phone are required");
      return;
    }

    try {
      const res = await fetch(`${API}/api/public/book-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Demo request submitted successfully!");

        setOpen(false);

        setForm({
          name: "",
          email: "",
          phone: "",
          organisation: "",
          message: ""
        });

      } else {
        toast.error(data.message || "Something went wrong");
      }

    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Book a Demo</h2>

          <Input
            placeholder="Name *"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <Input
            placeholder="Email *"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <Input
            placeholder="Phone *"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <Input
            placeholder="Organisation (optional)"
            value={form.organisation}
            onChange={(e) =>
              setForm({ ...form, organisation: e.target.value })
            }
          />

          <Textarea
            placeholder="Message (optional)"
            value={form.message}
            onChange={(e) =>
              setForm({ ...form, message: e.target.value })
            }
          />

          <Button className="w-full" onClick={handleSubmit}>
            Book Demo
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookDemoModal;