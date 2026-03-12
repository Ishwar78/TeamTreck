import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
const DemoInquiries = () => {
  const [data, setData] = useState<any[]>([]);


const { token } = useAuth();

useEffect(() => {
  if (!token) return;

  //fetch("http://localhost:5000/api/super-admin/demo-inquiries", {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/super-admin/demo-inquiries`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then((res) => res.json())
    .then((res) => setData(res.data))
    .catch((err) => console.error(err));
}, [token]);
  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Demo Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Organisation</th>
                    <th className="text-left p-2">Message</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item._id} className="border-b">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.email}</td>
                      <td className="p-2">{item.phone}</td>
                      <td className="p-2">{item.organisation}</td>
                      <td className="p-2">{item.message}</td>
                      <td className="p-2">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DemoInquiries;