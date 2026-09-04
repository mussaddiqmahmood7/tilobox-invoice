"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseButton } from "@/app/components";
import useToasts from "@/hooks/useToasts";
import type { InvoiceType } from "@/types";
import {
    Users,
    UserPlus,
    BookmarkPlus,
    Edit2,
    Trash2,
    Check,
    Building2,
    Search,
    ChevronDown,
} from "lucide-react";

export type SavedClient = {
    id: string;
    name: string;
    email?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    taxId?: string;
};

export const TILOBOX_CLIENTS_KEY = "tilobox_saved_clients";
const LEGACY_CLIENTS_KEY = "invoify:clients";

export function loadSavedClients(): SavedClient[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(TILOBOX_CLIENTS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
        // Fallback to legacy if available
        const legacyRaw = localStorage.getItem(LEGACY_CLIENTS_KEY);
        if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            if (Array.isArray(legacy)) {
                return legacy.map((c: Record<string, unknown>) => ({
                    id: (c.id as string) || crypto.randomUUID(),
                    name: (c.name as string) || "",
                    email: (c.email as string) || "",
                    address: (c.address as string) || "",
                    city: (c.city as string) || "",
                    zipCode: (c.zipCode as string) || "",
                    country: (c.country as string) || "",
                    phone: (c.phone as string) || "",
                    taxId: (Array.isArray(c.customInputs) ? (c.customInputs as Array<{ key?: string; value?: string }>).find((i) => /tax|vat/i.test(i?.key || ""))?.value : "") || "",
                }));
            }
        }
    } catch (e) {
        console.error("Failed to load saved clients:", e);
    }
    return [];
}

export function saveStoredClients(clients: SavedClient[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(TILOBOX_CLIENTS_KEY, JSON.stringify(clients));
    } catch (e) {
        console.error("Failed to save clients:", e);
    }
}

const emptyClient: Omit<SavedClient, "id"> = {
    name: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    phone: "",
    taxId: "",
};

const ClientAddressBookModal = () => {
    const { getValues, setValue, watch } = useFormContext<InvoiceType>();
    const { partySaved, partyRemoved } = useToasts();

    const [clients, setClients] = useState<SavedClient[]>([]);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<SavedClient | null>(null);
    const [clientForm, setClientForm] = useState<Omit<SavedClient, "id">>(emptyClient);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSavedFeedback, setIsSavedFeedback] = useState(false);

    // Guarded hydration on mount
    useEffect(() => {
        setClients(loadSavedClients());
    }, []);

    const currentName = watch("receiver.name");
    const canSaveCurrent = Boolean(currentName?.trim());

    const isCurrentClientSaved = useMemo(() => {
        if (!currentName?.trim()) return false;
        return clients.some(
            (c) => c.name.trim().toLowerCase() === currentName.trim().toLowerCase()
        );
    }, [clients, currentName]);

    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return clients;
        const q = searchQuery.toLowerCase();
        return clients.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.city && c.city.toLowerCase().includes(q)) ||
                (c.country && c.country.toLowerCase().includes(q))
        );
    }, [clients, searchQuery]);

    // Populate receiver fields from a saved client
    const handleSelectClient = useCallback(
        (client: SavedClient) => {
            setValue("receiver.name", client.name, { shouldDirty: true, shouldValidate: true });
            setValue("receiver.email", client.email || "", { shouldDirty: true });
            setValue("receiver.address", client.address || "", { shouldDirty: true });
            setValue("receiver.city", client.city || "", { shouldDirty: true });
            setValue("receiver.zipCode", client.zipCode || "", { shouldDirty: true });
            setValue("receiver.country", client.country || "", { shouldDirty: true });
            setValue("receiver.phone", client.phone || "", { shouldDirty: true });

            // If client has tax ID, populate customInputs
            if (client.taxId) {
                const existingInputs = getValues("receiver.customInputs") || [];
                const taxIdx = existingInputs.findIndex((i) => /tax|vat/i.test(i.key));
                if (taxIdx >= 0) {
                    const updated = [...existingInputs];
                    updated[taxIdx] = { ...updated[taxIdx], value: client.taxId };
                    setValue("receiver.customInputs", updated, { shouldDirty: true });
                } else {
                    setValue(
                        "receiver.customInputs",
                        [...existingInputs, { key: "Tax ID / VAT", value: client.taxId }],
                        { shouldDirty: true }
                    );
                }
            }

            setPopoverOpen(false);
        },
        [setValue, getValues]
    );

    // Save current receiver values into client book
    const handleSaveCurrentClient = useCallback(() => {
        const receiver = getValues("receiver");
        if (!receiver?.name?.trim()) return;

        // Extract Tax ID if present in custom inputs
        const customTax = receiver.customInputs?.find((i) => /tax|vat/i.test(i.key))?.value || "";

        const newClient: SavedClient = {
            id: crypto.randomUUID(),
            name: receiver.name.trim(),
            email: receiver.email || "",
            address: receiver.address || "",
            city: receiver.city || "",
            zipCode: receiver.zipCode || "",
            country: receiver.country || "",
            phone: receiver.phone || "",
            taxId: customTax,
        };

        const existingIdx = clients.findIndex(
            (c) => c.name.trim().toLowerCase() === newClient.name.toLowerCase()
        );

        let updated: SavedClient[];
        if (existingIdx >= 0) {
            updated = [...clients];
            updated[existingIdx] = { ...newClient, id: clients[existingIdx].id };
        } else {
            updated = [newClient, ...clients];
        }

        setClients(updated);
        saveStoredClients(updated);
        partySaved("receiver", newClient.name);
        setIsSavedFeedback(true);
        setTimeout(() => setIsSavedFeedback(false), 2500);
    }, [getValues, clients, partySaved]);

    // Open modal to add or edit client
    const handleOpenAddModal = () => {
        setEditingClient(null);
        setClientForm(emptyClient);
        setModalOpen(true);
        setPopoverOpen(false);
    };

    const handleOpenEditModal = (client: SavedClient, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingClient(client);
        setClientForm({
            name: client.name,
            email: client.email || "",
            address: client.address || "",
            city: client.city || "",
            zipCode: client.zipCode || "",
            country: client.country || "",
            phone: client.phone || "",
            taxId: client.taxId || "",
        });
        setModalOpen(true);
        setPopoverOpen(false);
    };

    const handleDeleteClient = (clientId: string, clientName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = clients.filter((c) => c.id !== clientId);
        setClients(updated);
        saveStoredClients(updated);
        partyRemoved("receiver", clientName);
    };

    const handleSaveClientForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientForm.name.trim()) return;

        let updated: SavedClient[];
        if (editingClient) {
            updated = clients.map((c) =>
                c.id === editingClient.id
                    ? { ...clientForm, id: editingClient.id }
                    : c
            );
        } else {
            const created: SavedClient = {
                ...clientForm,
                id: crypto.randomUUID(),
            };
            updated = [created, ...clients];
        }

        setClients(updated);
        saveStoredClients(updated);
        partySaved("receiver", clientForm.name);
        setModalOpen(false);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Popover / Dropdown to Pick & Manage Saved Clients */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <BaseButton
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        tooltipLabel="View and select saved clients"
                    >
                        <Users className="h-4 w-4 text-primary" />
                        <span>Saved Clients</span>
                        {clients.length > 0 && (
                            <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[11px] font-semibold text-primary">
                                {clients.length}
                            </span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </BaseButton>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-80 p-2 shadow-lg">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-primary" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Client Address Book
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add New</span>
                        </button>
                    </div>

                    {/* Search box if more than 3 clients */}
                    {clients.length > 3 && (
                        <div className="relative my-2">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>
                    )}

                    {/* Client List */}
                    <div className="my-1 max-h-56 divide-y divide-border/40 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                                {clients.length === 0
                                    ? "No saved clients yet. Save current details or add a new client."
                                    : "No matching clients found."}
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="group flex items-center justify-between gap-2 p-1.5 transition-colors hover:bg-muted/70 rounded-md"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSelectClient(client)}
                                        className="min-w-0 flex-1 text-start"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="truncate text-xs font-semibold text-foreground">
                                                {client.name}
                                            </span>
                                            {client.taxId && (
                                                <span className="rounded bg-muted px-1 text-[9px] text-muted-foreground">
                                                    VAT
                                                </span>
                                            )}
                                        </div>
                                        <span className="block truncate text-[11px] text-muted-foreground">
                                            {[client.city, client.country, client.email]
                                                .filter(Boolean)
                                                .join(" • ") || "No location details"}
                                        </span>
                                    </button>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            title="Edit client"
                                            onClick={(e) => handleOpenEditModal(client, e)}
                                            className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete client"
                                            onClick={(e) => handleDeleteClient(client.id, client.name, e)}
                                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick action footer */}
                    <div className="border-t pt-2 mt-1">
                        <BaseButton
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 text-xs text-primary"
                            onClick={handleOpenAddModal}
                        >
                            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                            Add Client Manually
                        </BaseButton>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Quick Save Current Client Button */}
            <BaseButton
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={!canSaveCurrent}
                onClick={handleSaveCurrentClient}
                tooltipLabel="Save current receiver details into address book"
            >
                <BookmarkPlus className="h-3.5 w-3.5 text-primary" />
                <span>Save Client</span>
            </BaseButton>

            {/* Saved Indicator */}
            {(isSavedFeedback || isCurrentClientSaved) && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Saved</span>
                </span>
            )}

            {/* Add / Edit Client Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingClient ? "Edit Client Details" : "Add New Client"}
                        </DialogTitle>
                        <DialogDescription>
                            Store client contact information in your browser for one-click invoice generation.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveClientForm} className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="client-name" className="text-xs font-medium">
                                Client / Company Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="client-name"
                                required
                                value={clientForm.name}
                                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                                placeholder="Acme Corp / John Smith"
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="client-email" className="text-xs font-medium">
                                    Email Address
                                </Label>
                                <Input
                                    id="client-email"
                                    type="email"
                                    value={clientForm.email}
                                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                    placeholder="billing@acme.com"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="client-phone" className="text-xs font-medium">
                                    Phone Number
                                </Label>
                                <Input
                                    id="client-phone"
                                    value={clientForm.phone}
                                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                    placeholder="+1 555-0199"
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="client-address" className="text-xs font-medium">
                                Street Address
                            </Label>
                            <Input
                                id="client-address"
                                value={clientForm.address}
                                onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                                placeholder="123 Business Avenue, Suite 400"
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="client-city" className="text-xs font-medium">
                                    City
                                </Label>
                                <Input
                                    id="client-city"
                                    value={clientForm.city}
                                    onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                                    placeholder="New York"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="client-zip" className="text-xs font-medium">
                                    Postal / ZIP
                                </Label>
                                <Input
                                    id="client-zip"
                                    value={clientForm.zipCode}
                                    onChange={(e) => setClientForm({ ...clientForm, zipCode: e.target.value })}
                                    placeholder="10001"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="client-country" className="text-xs font-medium">
                                    Country
                                </Label>
                                <Input
                                    id="client-country"
                                    value={clientForm.country}
                                    onChange={(e) => setClientForm({ ...clientForm, country: e.target.value })}
                                    placeholder="United States"
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="client-taxid" className="text-xs font-medium">
                                Tax ID / VAT Number
                            </Label>
                            <Input
                                id="client-taxid"
                                value={clientForm.taxId}
                                onChange={(e) => setClientForm({ ...clientForm, taxId: e.target.value })}
                                placeholder="e.g. US123456789 or GB987654321"
                                className="h-8 text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <BaseButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </BaseButton>
                            <BaseButton type="submit" size="sm">
                                {editingClient ? "Update Client" : "Save Client"}
                            </BaseButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientAddressBookModal;
