import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Check, X, Package, ShoppingBag, CheckCircle, Clock, XCircle } from "lucide-react";

const CATEGORIES = ["uniforms", "stationery", "digital", "events", "donations"];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  fulfilled: "default",
  cancelled: "destructive",
};

const BLANK_PRODUCT = {
  name: "", description: "", category: "uniforms", price: "", stock_quantity: "",
  is_digital: false, is_donation: false, is_active: true, image_url: "", download_url: "",
  variants: [] as { size: string; stock: number }[],
};

const ShopAdminPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [variantInput, setVariantInput] = useState({ size: "", stock: "" });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["shop-products-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_products").select("*").order("category").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["shop-orders-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, shop_order_items(item_name, quantity, unit_price, variant)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertProductMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      if (!form.price || isNaN(Number(form.price))) throw new Error("Valid price is required");
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price: Number(form.price),
        stock_quantity: form.is_digital || form.is_donation ? 0 : Number(form.stock_quantity) || 0,
        is_digital: form.is_digital,
        is_donation: form.is_donation,
        is_active: form.is_active,
        image_url: form.image_url.trim() || null,
        download_url: form.is_digital ? form.download_url.trim() || null : null,
        variants: form.variants.length > 0 ? form.variants : [],
      };
      if (editingId) {
        const { error } = await supabase.from("shop_products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shop_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products-admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setEditingId(null);
      setAddingProduct(false);
      setForm(BLANK_PRODUCT);
      toast.success(editingId ? "Product updated" : "Product added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shop_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products-admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      toast.success("Product removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("shop_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders-admin"] });
      toast.success("Order status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? "", category: p.category,
      price: String(p.price), stock_quantity: String(p.stock_quantity),
      is_digital: p.is_digital, is_donation: p.is_donation, is_active: p.is_active,
      image_url: p.image_url ?? "", download_url: p.download_url ?? "",
      variants: p.variants ?? [],
    });
    setAddingProduct(false);
  };

  const addVariant = () => {
    if (!variantInput.size.trim()) return;
    setForm((f) => ({ ...f, variants: [...f.variants, { size: variantInput.size.trim(), stock: Number(variantInput.stock) || 0 }] }));
    setVariantInput({ size: "", stock: "" });
  };

  const removeVariant = (idx: number) => setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const cancelEdit = () => { setEditingId(null); setAddingProduct(false); setForm(BLANK_PRODUCT); };

  const ProductForm = () => (
    <div className="rounded-lg border border-dashed p-4 space-y-4 bg-muted/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {editingId ? "Edit Product" : "New Product"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Product Name *</Label>
          <Input className="mt-1 h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. School Shirt" />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Input className="mt-1 h-9" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Price (KES) *</Label>
          <Input className="mt-1 h-9" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
        </div>
        {!form.is_digital && !form.is_donation && form.variants.length === 0 && (
          <div>
            <Label className="text-xs">Stock Quantity</Label>
            <Input className="mt-1 h-9" type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          </div>
        )}
      </div>
      <div>
        <Label className="text-xs">Image URL (optional)</Label>
        <Input className="mt-1 h-9" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
      </div>
      {/* Variants (sizes) */}
      {!form.is_digital && !form.is_donation && (
        <div>
          <Label className="text-xs">Size Variants (optional — for uniforms)</Label>
          <div className="flex gap-2 mt-1">
            <Input className="h-8 text-xs w-24" placeholder="Size (S/M/L)" value={variantInput.size} onChange={(e) => setVariantInput({ ...variantInput, size: e.target.value })} />
            <Input className="h-8 text-xs w-20" type="number" placeholder="Stock" value={variantInput.stock} onChange={(e) => setVariantInput({ ...variantInput, stock: e.target.value })} />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addVariant}><Plus className="h-3 w-3 mr-1" />Add</Button>
          </div>
          {form.variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.variants.map((v, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {v.size} ({v.stock})
                  <button onClick={() => removeVariant(i)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
      {form.is_digital && (
        <div>
          <Label className="text-xs">Download URL</Label>
          <Input className="mt-1 h-9" value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} placeholder="https://..." />
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch id="is_digital" checked={form.is_digital} onCheckedChange={(v) => setForm({ ...form, is_digital: v })} />
          <Label htmlFor="is_digital" className="text-sm cursor-pointer">Digital product</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_donation" checked={form.is_donation} onCheckedChange={(v) => setForm({ ...form, is_donation: v })} />
          <Label htmlFor="is_donation" className="text-sm cursor-pointer">Donation</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          <Label htmlFor="is_active" className="text-sm cursor-pointer">Active (visible in shop)</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="gap-1 h-8" onClick={() => upsertProductMutation.mutate()} disabled={upsertProductMutation.isPending}>
          <Check className="h-3.5 w-3.5" /> {upsertProductMutation.isPending ? "Saving..." : "Save Product"}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={cancelEdit}><X className="h-3.5 w-3.5" /> Cancel</Button>
      </div>
    </div>
  );

  const pendingCount = orders.filter((o: any) => o.status === "pending").length;
  const revenue = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Shop Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage products, stock, and customer orders.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Products</p>
            <p className="text-2xl font-bold mt-1">{products.length}</p>
            <p className="text-xs text-muted-foreground">{products.filter((p: any) => p.is_active).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Orders</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{orders.length} total orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">KES {revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Across all orders</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" />Products</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />Orders
            {pendingCount > 0 && <Badge className="h-4 px-1 text-xs ml-1">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Products tab */}
        <TabsContent value="products" className="space-y-4 mt-4">
          {!addingProduct && !editingId && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setAddingProduct(true); setForm(BLANK_PRODUCT); }}>
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          )}
          {(addingProduct || editingId) && <ProductForm />}
          {loadingProducts ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading products...</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No products yet — add one above</TableCell></TableRow>
                  ) : products.map((p: any) => (
                    <TableRow key={p.id} className={editingId === p.id ? "bg-primary/5" : ""}>
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>}
                      </TableCell>
                      <TableCell className="capitalize">{p.category}</TableCell>
                      <TableCell>KES {Number(p.price).toLocaleString()}</TableCell>
                      <TableCell>
                        {p.is_digital ? <Badge variant="outline" className="text-xs">Digital</Badge>
                          : p.is_donation ? <Badge variant="outline" className="text-xs">Donation</Badge>
                          : (p.variants?.length > 0)
                            ? <span className="text-xs">{p.variants.reduce((s: number, v: any) => s + v.stock, 0)} (sized)</span>
                            : p.stock_quantity}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteProductMutation.mutate(p.id)} disabled={deleteProductMutation.isPending}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {loadingOrders ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o: any) => (
                <Card key={o.id} className={o.status === "fulfilled" ? "opacity-70" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{o.customer_name}</p>
                          <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"} className="capitalize">{o.status}</Badge>
                          <span className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{o.customer_email}{o.customer_phone ? ` · ${o.customer_phone}` : ""}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleString("en-KE")} · {o.payment_method.replace(/_/g, " ")}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(o.shop_order_items ?? []).map((item: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {item.item_name}{item.variant ? ` (${item.variant})` : ""} ×{item.quantity}
                            </Badge>
                          ))}
                        </div>
                        {o.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{o.notes}"</p>}
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-primary">KES {Number(o.total).toLocaleString()}</p>
                        <div className="flex gap-1.5 justify-end">
                          {o.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: "confirmed" })}>
                              <Check className="h-3 w-3" /> Confirm
                            </Button>
                          )}
                          {(o.status === "pending" || o.status === "confirmed") && (
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: "fulfilled" })}>
                              <CheckCircle className="h-3 w-3" /> Fulfil
                            </Button>
                          )}
                          {o.status !== "cancelled" && o.status !== "fulfilled" && (
                            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: "cancelled" })}>
                              <XCircle className="h-3 w-3" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopAdminPage;
