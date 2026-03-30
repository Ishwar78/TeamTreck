import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Send, FileText, User, Paperclip } from "lucide-react";

interface Report {
  _id: string;
  title: string;
  subject: string;
  body: string;
  fileUrl?: string;
  originalFileName?: string;
  user_id: { _id: string; name: string; email: string; role: string };
  createdAt: string;
}

const DailyReport = () => {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const isAdmin = user?.role === "company_admin" || user?.role === "super_admin" || user?.role === "sub_admin";

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/daily-report`, token);
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !body) {
      toast.error("Please fill all fields");
      return;
    }

    setUploading(true);
    try {
      let fileUrl = "";
      let originalFileName = "";

      if (attachedFile) {
         const formData = new FormData();
         formData.append("file", attachedFile);
         const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://multiclout.in";
         const uploadRes = await fetch(`${API_BASE}/api/daily-report/upload`, {
           method: "POST",
           headers: { Authorization: `Bearer ${token}` },
           body: formData,
         });
         const uploadData = await uploadRes.json();
         if (!uploadRes.ok || !uploadData.success) {
           throw new Error(uploadData.message || "File upload failed");
         }
         fileUrl = uploadData.fileUrl;
         originalFileName = uploadData.originalName;
      }

      const data = await apiFetch(`/api/daily-report`, token, {
        method: "POST",
        body: JSON.stringify({ title, subject, body, fileUrl, originalFileName }),
      });
      if (data.success) {
        toast.success("Daily report sent successfully!");
        setTitle("");
        setSubject("");
        setBody("");
        setAttachedFile(null);
        fetchReports();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send report");
    } finally {
      setUploading(false);
    }
  };

  const UserView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Send size={18} className="text-primary" />
            Send Daily Report
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Daily Update - Monday"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Completed API integration"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message Body</Label>
              <Textarea
                id="body"
                placeholder="Write your detailed report here..."
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Attachment (Optional, e.g. Excel/CSV)</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {attachedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {attachedFile.name}</p>}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={uploading}>
              <Send size={16} /> {uploading ? "Sending..." : "Send Report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm flex flex-col h-[600px]">
        <CardHeader className="bg-muted/30 border-b border-border pb-4 shrink-0">
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            My Sent Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto p-0 flex-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No reports sent yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((r) => (
                <div key={r._id} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(new Date(r.createdAt), "PPp")}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{r.title}</h4>
                  <p className="font-medium text-sm text-primary mb-2">{r.subject}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
                  {r.fileUrl && (
                    <a href={(import.meta.env.VITE_API_BASE_URL || "http://multiclout.in") + r.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-xs text-blue-600 hover:underline hover:text-blue-800 w-fit p-1.5 px-2 bg-blue-500/10 rounded-md transition-colors">
                      <Paperclip size={14} /> {r.originalFileName || "Attached File"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const AdminView = () => (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-muted/30 border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Employee Daily Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No reports submitted by employees.</div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((r) => (
              <div key={r._id} className="p-6 hover:bg-muted/5 transition-colors grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                <div className="border-r border-transparent md:border-border pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="font-semibold">{r.user_id?.name || "Unknown"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{r.user_id?.email}</div>
                  <div className="text-xs text-primary mt-1 border border-primary/20 bg-primary/5 rounded px-2 py-0.5 inline-block">
                    {r.user_id?.role}
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">
                    {format(new Date(r.createdAt), "PPp")}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{r.title}</h4>
                  <p className="font-medium text-primary mb-3 text-sm">{r.subject}</p>
                  <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap text-sm border border-border">
                    {r.body}
                  </div>
                 {r.fileUrl && (
  <div className="mt-3 flex gap-2 flex-wrap">

    {/* ✅ Download Button */}
    <a
      href={(import.meta.env.VITE_API_BASE_URL || "http://multiclout.in") + r.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors"
    >
      <Paperclip size={16} /> Download
    </a>

    {/* ✅ View Button (without download) */}
    {/* <a
      href={`https://docs.google.com/viewer?url=${encodeURIComponent(
  (import.meta.env.VITE_API_BASE_URL || "http://multiclout.in") + r.fileUrl
)}&embedded=true`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded border border-green-200 transition-colors"
    >
      👁 View
    </a> */}

  </div>
)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-6 px-4">
          <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Review daily reports submitted by your team." : "Submit and track your daily work reports."}
          </p>
        </div>
        <div className="px-4">
          {isAdmin ? <AdminView /> : <UserView />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyReport;
