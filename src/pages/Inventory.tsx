import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useInventory, InventoryItem } from "@/providers/InventoryProvider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Inventory = () => {
    const { toast } = useToast();
    const { items, addItem, updateItem } = useInventory();

    // Form State, removed local items state
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<InventoryItem>({
        id: "",
        name: "",
        unit: "",
        unitPrice: 0,
        quantity: 0,
        status: "In Stock"
    });

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusStyle = (status: InventoryItem["status"]) => {
        switch (status) {
            case "In Stock": return "bg-green-100 text-green-700";
            case "Low Stock": return "bg-yellow-100 text-yellow-700";
            case "Out of Stock": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const handleOpenDialog = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                id: `i${Date.now()}`,
                name: "",
                unit: "",
                unitPrice: 0,
                quantity: 0,
                status: "In Stock"
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.unit) {
            toast({
                title: "Error",
                description: "Name and Unit are required.",
                variant: "destructive"
            });
            return;
        }

        if (editingItem) {
            // Update
            updateItem(formData);
            toast({ title: "Success", description: "Item updated successfully." });
        } else {
            // Create
            addItem(formData);
            toast({ title: "Success", description: "Item added successfully." });
        }
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold tracking-tight">Inventory Management</h1>
                <Button className="bg-[#009ADE] hover:bg-[#007bb5]" onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            </div>

            <Card className="shadow-lg border-border/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Current Stock</CardTitle>
                        <div className="relative w-[300px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search order ID or name..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Total Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>In hands</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-slate-500 text-xs">{item.id}</TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                                        <TableCell>${(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                                <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No items found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UsageHistorySection />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="unit" className="text-right">Unit</Label>
                            <Input id="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Unit Price</Label>
                            <Input id="price" type="number" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Quantity</Label>
                            <Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val: "In Stock" | "Low Stock" | "Out of Stock") => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="In Stock">In Stock</SelectItem>
                                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingItem ? "Save Changes" : "Add Item"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const UsageHistorySection = () => {
    const { usageLogs, items } = useInventory();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const filteredLogs = usageLogs.filter(log => {
        if (startDate && log.date < startDate) return false;
        if (endDate && log.date > endDate) return false;
        return true;
    });

    // Aggregate data by Item
    const aggregatedData = useMemo(() => {
        const acc: Record<string, { name: string; quantity: number; cost: number; unit: string }> = {};

        filteredLogs.forEach(log => {
            if (!acc[log.itemId]) {
                const itemDef = items.find(i => i.id === log.itemId);
                acc[log.itemId] = {
                    name: log.itemName,
                    quantity: 0,
                    cost: 0,
                    unit: itemDef?.unit || "units"
                };
            }
            acc[log.itemId].quantity += log.quantity;
            acc[log.itemId].cost += log.totalCost;
        });

        return Object.values(acc);
    }, [filteredLogs, items]);

    const totalCost = filteredLogs.reduce((sum, log) => sum + log.totalCost, 0);

    return (
        <Card className="shadow-lg border-border/50">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle>Inventory Usage History & Analysis</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="start-date" className="whitespace-nowrap text-xs">From:</Label>
                            <Input
                                id="start-date"
                                type="date"
                                className="w-auto"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="end-date" className="whitespace-nowrap text-xs">To:</Label>
                            <Input
                                id="end-date"
                                type="date"
                                className="w-auto"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        {(startDate || endDate) && (
                            <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-sm text-slate-500 font-medium">Total Period Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        ${totalCost.toFixed(2)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Consumption Chart */}
                    <div className="h-[300px] w-full">
                        <h3 className="text-lg font-semibold mb-4 text-center">Consumption (Quantity)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aggregatedData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number, name: string, props: any) => [`${value} ${props.payload.unit}`, "Quantity"]}
                                />
                                <Legend />
                                <Bar dataKey="quantity" name="Quantity Used" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Cost Chart */}
                    <div className="h-[300px] w-full">
                        <h3 className="text-lg font-semibold mb-4 text-center">Cost Analysis ($)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aggregatedData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="cost" name="Total Cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity Used</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-slate-600">{log.date}</TableCell>
                                    <TableCell className="font-medium">{log.itemName}</TableCell>
                                    <TableCell>{log.quantity}</TableCell>
                                    <TableCell>${log.unitPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium text-slate-900">
                                        ${log.totalCost.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No usage records found for this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default Inventory;
