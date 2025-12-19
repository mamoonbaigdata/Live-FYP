import { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";

export type InventoryItem = {
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    status: "In Stock" | "Low Stock" | "Out of Stock";
};

export type InventoryUsageLog = {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    date: string; // YYYY-MM-DD
};

type InventoryContextType = {
    items: InventoryItem[];
    usageLogs: InventoryUsageLog[];
    addItem: (item: InventoryItem) => void;
    updateItem: (item: InventoryItem) => void;
    deductItem: (id: string, amount: number) => boolean;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error("useInventory must be used within an InventoryProvider");
    }
    return context;
};

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [items, setItems] = useState<InventoryItem[]>([
        { id: "i1", name: "Liquid Chlorine", unit: "Gallons", unitPrice: 15.50, quantity: 25, status: "In Stock" },
        { id: "i2", name: "pH Plus", unit: "lbs", unitPrice: 22.00, quantity: 5, status: "Low Stock" },
        { id: "i3", name: "Skimmer Basket", unit: "units", unitPrice: 12.99, quantity: 2, status: "In Stock" },
        { id: "i4", name: "Test Strips", unit: "packs", unitPrice: 18.75, quantity: 0, status: "Out of Stock" },
    ]);
    const [usageLogs, setUsageLogs] = useState<InventoryUsageLog[]>([]);

    const updateStatus = (quantity: number): InventoryItem["status"] => {
        if (quantity <= 0) return "Out of Stock";
        if (quantity < 10) return "Low Stock"; // Simple rule, can be refined per item
        return "In Stock";
    };

    const addItem = (item: InventoryItem) => {
        setItems((prev) => [...prev, item]);
    };

    const updateItem = (updatedItem: InventoryItem) => {
        setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    };

    const deductItem = (id: string, amount: number): boolean => {
        const itemIndex = items.findIndex(i => i.id === id);
        if (itemIndex === -1) return false;

        const item = items[itemIndex];

        if (item.quantity < amount) {
            return false;
        }

        const newItems = [...items];
        const newItem = { ...item };
        newItem.quantity -= amount;
        newItem.status = updateStatus(newItem.quantity);
        newItems[itemIndex] = newItem;
        setItems(newItems);

        // Log usage
        const now = new Date();
        const log: InventoryUsageLog = {
            id: `log-${now.getTime()}`,
            itemId: item.id,
            itemName: item.name,
            quantity: amount,
            unitPrice: item.unitPrice,
            totalCost: item.unitPrice * amount,
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        };
        setUsageLogs(prev => [log, ...prev]);

        return true;
    };

    return (
        <InventoryContext.Provider value={{ items, usageLogs, addItem, updateItem, deductItem }}>
            {children}
        </InventoryContext.Provider>
    );
};
