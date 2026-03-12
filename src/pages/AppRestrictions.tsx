import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, ShieldBan, Globe, AppWindow, Plus, Trash2, AlertTriangle, Search, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RuleType = "allowed" | "blocked";
type RuleCategory = "app" | "url";

interface Rule {
  id: string;
  name: string;
  type: RuleType;
  category: RuleCategory;
  createdAt: string;
  notifyAdmin: boolean;
}

const INITIAL_RULES: Rule[] = [
  { id: "1", name: "Slack", type: "allowed", category: "app", createdAt: "2025-12-01", notifyAdmin: false },
  { id: "2", name: "Visual Studio Code", type: "allowed", category: "app", createdAt: "2025-12-01", notifyAdmin: false },
  { id: "3", name: "Google Chrome", type: "allowed", category: "app", createdAt: "2025-12-01", notifyAdmin: false },
  { id: "4", name: "Steam", type: "blocked", category: "app", createdAt: "2025-12-05", notifyAdmin: true },
  { id: "5", name: "Discord", type: "blocked", category: "app", createdAt: "2025-12-05", notifyAdmin: true },
  { id: "6", name: "Epic Games Launcher", type: "blocked", category: "app", createdAt: "2025-12-10", notifyAdmin: true },
  { id: "7", name: "https://github.com", type: "allowed", category: "url", createdAt: "2025-12-01", notifyAdmin: false },
  { id: "8", name: "https://stackoverflow.com", type: "allowed", category: "url", createdAt: "2025-12-01", notifyAdmin: false },
  { id: "9", name: "https://docs.google.com", type: "allowed", category: "url", createdAt: "2025-12-02", notifyAdmin: false },
  { id: "10", name: "https://facebook.com", type: "blocked", category: "url", createdAt: "2025-12-05", notifyAdmin: true },
  { id: "11", name: "https://youtube.com", type: "blocked", category: "url", createdAt: "2025-12-05", notifyAdmin: true },
  { id: "12", name: "https://tiktok.com", type: "blocked", category: "url", createdAt: "2025-12-08", notifyAdmin: true },
];

const AppRestrictions = () => {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [newEntry, setNewEntry] = useState("");
  const [newType, setNewType] = useState<RuleType>("blocked");
  const [newCategory, setNewCategory] = useState<RuleCategory>("app");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("apps");
  const { toast } = useToast();

  const addRule = () => {
    const trimmed = newEntry.trim();
    if (!trimmed) return;

    const duplicate = rules.find(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase() && r.category === newCategory
    );
    if (duplicate) {
      toast({ title: "Duplicate entry", description: `"${trimmed}" already exists in ${newCategory} rules.`, variant: "destructive" });
      return;
    }

    const rule: Rule = {
      id: crypto.randomUUID(),
      name: trimmed,
      type: newType,
      category: newCategory,
      createdAt: new Date().toISOString().split("T")[0],
      notifyAdmin: newType === "blocked",
    };
    setRules((prev) => [rule, ...prev]);
    setNewEntry("");
    toast({ title: "Rule added", description: `${newType === "blocked" ? "Blocked" : "Allowed"} ${newCategory}: "${trimmed}"` });
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Rule removed" });
  };

  const toggleNotify = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, notifyAdmin: !r.notifyAdmin } : r))
    );
  };

  const filteredRules = (category: RuleCategory) =>
    rules
      .filter((r) => r.category === category)
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const countByType = (category: RuleCategory, type: RuleType) =>
    rules.filter((r) => r.category === category && r.type === type).length;

  const RuleTable = ({ category }: { category: RuleCategory }) => {
    const data = filteredRules(category);
    const allowed = data.filter((r) => r.type === "allowed");
    const blocked = data.filter((r) => r.type === "blocked");

    return (
      <div className="space-y-6">
        {/* Blocked section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldBan size={16} className="text-destructive" />
            <h3 className="font-semibold text-sm text-destructive">
              Blocked ({blocked.length})
            </h3>
          </div>
          {blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-6">No blocked {category === "app" ? "applications" : "URLs"} configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Notify Admin</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocked.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] px-1.5">BLOCKED</Badge>
                        {rule.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{rule.createdAt}</TableCell>
                    <TableCell>
                      <Switch checked={rule.notifyAdmin} onCheckedChange={() => toggleNotify(rule.id)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Separator />

        {/* Allowed section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-emerald-500" />
            <h3 className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
              Allowed ({allowed.length})
            </h3>
          </div>
          {allowed.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-6">No allowed {category === "app" ? "applications" : "URLs"} configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Notify Admin</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowed.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5">ALLOWED</Badge>
                        {rule.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{rule.createdAt}</TableCell>
                    <TableCell>
                      <Switch checked={rule.notifyAdmin} onCheckedChange={() => toggleNotify(rule.id)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  };

  return (
    <PageGuard permission="configure_monitoring">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">App & Website Restrictions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Define allowed and blocked applications and URLs. The desktop agent enforces these rules in real time.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><AppWindow size={18} className="text-emerald-500" /></div>
                <div>
                  <p className="text-xl font-bold">{countByType("app", "allowed")}</p>
                  <p className="text-[11px] text-muted-foreground">Allowed Apps</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><AppWindow size={18} className="text-destructive" /></div>
                <div>
                  <p className="text-xl font-bold">{countByType("app", "blocked")}</p>
                  <p className="text-[11px] text-muted-foreground">Blocked Apps</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><Globe size={18} className="text-emerald-500" /></div>
                <div>
                  <p className="text-xl font-bold">{countByType("url", "allowed")}</p>
                  <p className="text-[11px] text-muted-foreground">Allowed URLs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><Globe size={18} className="text-destructive" /></div>
                <div>
                  <p className="text-xl font-bold">{countByType("url", "blocked")}</p>
                  <p className="text-[11px] text-muted-foreground">Blocked URLs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-foreground">
                <strong>How it works:</strong> The desktop agent detects active apps and URLs. Blocked items are flagged as <span className="text-destructive font-semibold">unproductive time</span>, and admins are notified when configured. Rules are company-specific and enforced per-device.
              </div>
            </CardContent>
          </Card>

          {/* Add Rule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add New Rule</CardTitle>
              <CardDescription>Add an application or URL to the allowed or blocked list.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as RuleCategory)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newType} onValueChange={(v) => setNewType(v as RuleType)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocked">Block</SelectItem>
                    <SelectItem value="allowed">Allow</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={newCategory === "app" ? "e.g. Spotify" : "e.g. https://reddit.com"}
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRule()}
                  className="flex-1"
                />
                <Button onClick={addRule} className="gap-2">
                  <Plus size={14} /> Add Rule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rules Tables */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Restriction Rules</CardTitle>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search rules…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="apps" className="gap-1.5">
                    <AppWindow size={14} /> Applications
                  </TabsTrigger>
                  <TabsTrigger value="urls" className="gap-1.5">
                    <Globe size={14} /> Websites
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="apps" className="mt-4">
                  <RuleTable category="app" />
                </TabsContent>
                <TabsContent value="urls" className="mt-4">
                  <RuleTable category="url" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
};

export default AppRestrictions;
