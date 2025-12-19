import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useInventory } from "@/providers/InventoryProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type Task = { id: string; title: string; due: string; tag: "Warning" | "High Priority" | "Routine" };
type HistoryItem = { id: string; orderId: string; title: string; date: string; user: string; status: "Completed" | "Scheduled" };

const Maintainence = () => {
  const { toast } = useToast();
  const { items, deductItem } = useInventory();

  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", title: "Balance pH Level", due: "IMMEDIATE", tag: "Warning" },
    { id: "t2", title: "Filter Backwash", due: "2025-11-20", tag: "High Priority" },
    { id: "t3", title: "Skimmer Basket Cleaning", due: "2025-11-22", tag: "Routine" },
  ]);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "h1", orderId: "#ORD-8921", title: "Pump replaced", date: "2025-10-01", user: "Technician: Smith", status: "Completed" },
    { id: "h2", orderId: "#ORD-3312", title: "Alkalinity adjustment", date: "2025-11-15", user: "System", status: "Completed" },
    { id: "h3", orderId: "#ORD-1109", title: "Main Drain cover check", date: "2025-11-14", user: "Self", status: "Completed" },
    { id: "h4", orderId: "#ORD-9981", title: "Chlorine Shock", date: "2025-11-10", user: "Self", status: "Completed" },
  ]);

  // New Log State
  const [newLog, setNewLog] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("none");
  const [useQuantity, setUseQuantity] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState("");

  const tagStyle = (tag: Task["tag"]) =>
    tag === "Warning"
      ? "bg-orange-100 text-orange-700"
      : tag === "High Priority"
        ? "bg-teal-100 text-teal-700"
        : "bg-gray-100 text-gray-600";

  const filteredHistory = useMemo(() => {
    return history.filter(item =>
      item.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  const logMaintenance = () => {
    if (newLog.trim().length === 0) return;

    let logTitle = newLog.trim();

    // If inventory item selected, try to deduct
    if (selectedItemId !== "none") {
      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        if (useQuantity <= 0) {
          toast({ title: "Error", description: "Please enter a valid quantity.", variant: "destructive" });
          return;
        }
        if (item.quantity < useQuantity) {
          toast({ title: "Error", description: `Not enough stock for ${item.name}. Available: ${item.quantity}`, variant: "destructive" });
          return;
        }

        // Deduct
        const success = deductItem(selectedItemId, useQuantity);
        if (success) {
          logTitle += ` (Used ${useQuantity} ${item.unit} of ${item.name})`;
        } else {
          toast({ title: "Error", description: "Failed to deduct inventory.", variant: "destructive" });
          return;
        }
      }
    }

    const now = new Date();
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const item: HistoryItem = {
      id: `h-${now.getTime()}`,
      orderId: `#ORD-${randomId}`,
      title: logTitle,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      user: "Self",
      status: "Completed",
    };
    setHistory((prev) => [item, ...prev]);
    setNewLog("");
    setSelectedItemId("none");
    setUseQuantity(0);
    toast({ title: "Success", description: "Maintenance logged successfully." });
  };

  const deleteLog = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const downloadCSV = () => {
    const headers = ["Order ID", "Activity", "Date", "User", "Status"];
    const rows = filteredHistory.map(h => [h.orderId, h.title, h.date, h.user, h.status]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `maintenance_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Scheduled Maintenance & History</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xl">Upcoming Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-white px-3 py-3 shadow-sm">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.title}</div>
                    <div className="text-xs text-muted-foreground">Due: {t.due}</div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${tagStyle(t.tag)}`}>{t.tag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-xl">Recent History (Last 3)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-desc" className="text-xs text-muted-foreground mb-1 block">Description</Label>
                <Input id="task-desc" placeholder="Describe task..." value={newLog} onChange={(e) => setNewLog(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Use Inventory (Optional)</Label>
                  <Select value={selectedItemId} onValueChange={(val) => setSelectedItemId(val)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {items.map(i => (
                        <SelectItem key={i.id} value={i.id} disabled={i.status === "Out of Stock"}>
                          {i.name} ({i.quantity} {i.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="h-9"
                    value={useQuantity || ""}
                    onChange={(e) => setUseQuantity(parseFloat(e.target.value) || 0)}
                    disabled={selectedItemId === "none"}
                  />
                </div>
              </div>

              <Button onClick={logMaintenance} className="w-full bg-slate-900 hover:bg-slate-800">
                Log New Maintenance
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {history.slice(0, 3).map((h) => (
                <div key={h.id} className="rounded-lg border border-border/40 bg-white px-3 py-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-semibold text-foreground">{h.title}</div>
                    <div className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{h.orderId}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Date: {h.date} | User: {h.user} ({h.status})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Maintenance Records</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search Order ID..."
                  className="pl-8 w-[200px] md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={downloadCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium font-mono text-slate-600">{h.orderId}</TableCell>
                    <TableCell>{h.title}</TableCell>
                    <TableCell>{h.date}</TableCell>
                    <TableCell>{h.user}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {h.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Maintenance Log</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the record <strong>{h.orderId}</strong>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteLog(h.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No results found for "{searchQuery}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintainence;
