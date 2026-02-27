import { Header } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Server, FileKey2, AlertTriangle, TrendingUp, Activity, Clock } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" description="Overview of your infrastructure" />
      <main className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                Active customers
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Servers</CardTitle>
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Server className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                <Activity className="mr-1 h-3 w-3 text-green-500" />
                Managed servers
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Licenses</CardTitle>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <FileKey2 className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                Active licenses
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-amber-500/20 bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
              <div className="rounded-lg bg-amber-500/10 p-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">0</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                Within 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming Expirations</CardTitle>
                  <CardDescription>Licenses expiring in the next 30 days</CardDescription>
                </div>
                <AlertTriangle className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <FileKey2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">No licenses expiring soon</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  All licenses are in good standing
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Latest changes to tracked items</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">No recent activity</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Changes will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
