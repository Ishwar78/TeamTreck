import DashboardLayout from "@/components/DashboardLayout";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ProductivityCharts from "@/components/dashboard/ProductivityCharts";
import ScreenshotGallery from "@/components/dashboard/ScreenshotGallery";

const ActivityDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity & Analytics</h1>
          <p className="text-sm text-muted-foreground">Live feed, productivity charts, and screenshot gallery</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ProductivityCharts />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>

        <ScreenshotGallery />
      </div>
    </DashboardLayout>
  );
};

export default ActivityDashboard;
