import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Check, X, Package, ShoppingBag, CheckCircle, XCircle, Gift } from "lucide-react";

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

const BLANK_BUNDLE = {
  name: "", description: "", original_price: "", bundle_price: "",
  image_url: "", is_active: true, selected_product_ids: [] as string[]
};

const ShopAdminPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  
  // Product State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [variantInput, setVariantInput] = useState({ size: "", stock: "" });
  
  // Bundle State
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [addingBundle, setAddingBundle] = useState(false);
  const [bundleForm, setBundleForm] = useState(BLANK_BUNDLE);

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File, target: "product" | "bundle" = "product") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `shop/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
      
      if (target === "product") setForm((f) => ({ ...f, image_url: data.publicUrl }));
      else setBundleForm((f) => ({ ...f, image_url: data.publicUrl }));
      
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["shop-products-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_products").select("*").order("category").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ["shop-bundles-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_bundles").select("*, shop_bundle_items(product_id)").order("created_at", { ascending: false });
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

  // Product Mutations
  const upsertProductMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      if (!form.price || isNaN(Number(form.price))) throw new Error("Valid price is required");
      
      let calculatedStock = form.is_digital || form.is_donation ? 0 : Number(form.stock_quantity) || 0;
      if (form.variants.length > 0) {
        calculatedStock = form.variants.reduce((sum, v) => sum + v.stock, 0); // Auto-sync stock with variants
      }

      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price: Number(form.price),
        stock_quantity: calculatedStock,
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

  // Bundle Mutations
  const upsertBundleMutation = useMutation({
    mutationFn: async () => {
      if (!bundleForm.name.trim()) throw new Error("Name is required");
      if (!bundleForm.bundle_price || isNaN(Number(bundleForm.bundle_price))) throw new Error("Valid bundle price required");
      if (!bundleForm.original_price || isNaN(Number(bundleForm.original_price))) throw new Error("Valid original price required");

      const payload = {
        name: bundleForm.name.trim(),
        description: bundleForm.description.trim() || null,
        original_price: Number(bundleForm.original_price),
        bundle_price: Number(bundleForm.bundle_price),
        image_url: bundleForm.image_url.trim() || null,
        is_active: bundleForm.is_active,
      };

      let currentBundleId = editingBundleId;

      if (currentBundleId) {
        const { error } = await supabase.from("shop_bundles").update(payload).eq("id", currentBundleId);
        if (error) throw error;
        await supabase.from("shop_bundle_items").delete().eq("bundle_id", currentBundleId);
      } else {
        const { data, error } = await supabase.from("shop_bundles").insert(payload).select().single();
        if (error) throw error;
        currentBundleId = data.id;
      }

      if (bundleForm.selected_product_ids.length > 0) {
        const items = bundleForm.selected_product_ids.map(pid => ({ bundle_id: currentBundleId, product_id: pid }));
        const { error: itemsErr } = await supabase.from("shop_bundle_items").insert(items);
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-bundles-admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-bundles"] });
      setEditingBundleId(null);
      setAddingBundle(false);
      setBundleForm(BLANK_BUNDLE);
      toast.success(editingBundleId ? "Bundle updated" : "Bundle added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBundleMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("shop_bundle_items").delete().eq("bundle_id", id);
      const { error } = await supabase.from("shop_bundles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-bundles-admin"] });
      queryClient.invalidateQueries({ queryKey: ["shop-bundles"] });
      toast.success("Bundle removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Order Mutations
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

  // Product Form Actions
  const startEditProduct = (p: any) => {
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
  const cancelEditProduct = () => { setEditingId(null); setAddingProduct(false); setForm(BLANK_PRODUCT); };

  // Bundle Form Actions
  const startEditBundle = (b: any) => {
    setEditingBundleId(b.id);
    setBundleForm({
      name: b.name, description: b.description ?? "",
      original_price: String(b.original_price), bundle_price: String(b.bundle_price),
      image_url: b.image_url ?? "", is_active: b.is_active,
      selected_product_ids: (b.shop_bundle_items ?? []).map((item: any) => item.product_id),
    });
    setAddingBundle(false);
  };
  const cancelEditBundle = () => { setEditingBundleId(null); setAddingBundle(false); setBundleForm(BLANK_BUNDLE); };

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
        <Label className="text-xs">Product Image</Label>
        <div className="mt-1 flex items-center gap-3">
          {form.image_url ? (
            <img src={form.image_url} alt="Preview" className="h-16 w-16 rounded-md object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-md border border-dashed flex items-center justify-center bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Input
              type="file" accept="image/*"
              className="h-9 text-xs file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
              disabled={uploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "product");
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              {uploadingImage && <span className="text-xs text-muted-foreground">Uploading...</span>}
              {form.image_url && !uploadingImage && (
                <button type="button" onClick={() => setForm({ ...form, image_url: "" })} className="text-xs text-destructive hover:underline">
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
        <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={cancelEditProduct}><X className="h-3.5 w-3.5" /> Cancel</Button>
      </div>
    </div>
  );

  const BundleForm = () => (
    <div className="rounded-lg border border-primary/40 p-4 space-y-4 bg-primary/5">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
        {editingBundleId ? "Edit Value Bundle" : "New Value Bundle"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Bundle Name *</Label>
          <Input className="mt-1 h-9 bg-background" value={bundleForm.name} onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })} placeholder="e.g. Back to School Pack" />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Input className="mt-1 h-9 bg-background" value={bundleForm.description} onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })} placeholder="Brief description..." />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Original Value (KES) *</Label>
          <Input className="mt-1 h-9 bg-background line-through text-muted-foreground" type="number" min="0" value={bundleForm.original_price} onChange={(e) => setBundleForm({ ...bundleForm, original_price: e.target.value })} placeholder="Total without discount" />
        </div>
        <div>
          <Label className="text-xs text-primary font-medium">Bundle Price (KES) *</Label>
          <Input className="mt-1 h-9 bg-background font-bold" type="number" min="0" value={bundleForm.bundle_price} onChange={(e) => setBundleForm({ ...bundleForm, bundle_price: e.target.value })} placeholder="Discounted price" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Included Products</Label>
        <div className="flex flex-wrap gap-2 mt-2 p-3 bg-background border rounded-md max-h-48 overflow-y-auto">
          {products.filter((p: any) => p.is_active).map((p: any) => {
            const isSelected = bundleForm.selected_product_ids.includes(p.id);
            return (
              <Badge
                key={p.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => {
                  setBundleForm(f => ({
                    ...f,
                    selected_product_ids: isSelected 
                      ? f.selected_product_ids.filter(id => id !== p.id) 
                      : [...f.selected_product_ids, p.id]
                  }))
                }}
              >
                {isSelected && <Check className="h-3 w-3 mr-1" />}
                {p.name}
              </Badge>
            )
          })}
          {products.length === 0 && <span className="text-xs text-muted-foreground">Add products first before making a bundle.</span>}
        </div>
      </div>
      <div>
        <Label className="text-xs">Bundle Banner Image</Label>
        <div className="mt-1 flex items-center gap-3">
          {bundleForm.image_url ? (
            <img src={bundleForm.image_url} alt="Preview" className="h-16 w-24 rounded-md object-cover border" />
          ) : (
            <div className="h-16 w-24 rounded-md border border-dashed flex items-center justify-center bg-background">
              <Gift className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Input
              type="file" accept="image/*"
              className="h-9 text-xs bg-background file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
              disabled={uploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "bundle");
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              {uploadingImage && <span className="text-xs text-muted-foreground">Uploading...</span>}
              {bundleForm.image_url && !uploadingImage && (
                <button type="button" onClick={() => setBundleForm({ ...bundleForm, image_url: "" })} className="text-xs text-destructive hover:underline">
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="bundle_active" checked={bundleForm.is_active} onCheckedChange={(v) => setBundleForm({ ...bundleForm, is_active: v })} />
        <Label htmlFor="bundle_active" className="text-sm cursor-pointer">Active (visible in shop)</Label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="gap-1 h-8" onClick={() => upsertBundleMutation.mutate()} disabled={upsertBundleMutation.isPending}>
          <Check className="h-3.5 w-3.5" /> {upsertBundleMutation.isPending ? "Saving..." : "Save Bundle"}
        </Button>
        <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={cancelEditBundle}><X className="h-3.5 w-3.5" /> Cancel</Button>
      </div>
    </div>
  );

  const pendingCount = orders.filter((o: any) => o.status === "pending").length;
  const revenue = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Shop Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage products, value bundles, and customer orders.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Products</p>
            <p className="text-2xl font-bold mt-1">{products.length}</p>
            <p className="text-xs text-muted-foreground">{products.filter((p: any) => p.is_active).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Value Bundles</p>
            <p className="text-2xl font-bold mt-1 text-primary">{bundles.length}</p>
            <p className="text-xs text-muted-foreground">{bundles.filter((b: any) => b.is_active).length} active</p>
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
          <TabsTrigger value="bundles" className="gap-1.5"><Gift className="h-3.5 w-3.5" />Bundles</TabsTrigger>
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
                        {p.is_digital ? <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Digital</Badge>
                          : p.is_donation ? <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-300">Donation</Badge>
                          : (p.variants?.length > 0)
                            ? <span className="text-xs">{p.stock_quantity} (across {p.variants.length} sizes)</span>
                            : p.stock_quantity}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? "default" : "secondary"}>
                          {p.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditProduct(p)}>
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

        {/* Bundles tab */}
        <TabsContent value="bundles" className="space-y-4 mt-4">
          {!addingBundle && !editingBundleId && (
            <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30" onClick={() => { setAddingBundle(true); setBundleForm(BLANK_BUNDLE); }}>
              <Plus className="h-3.5 w-3.5" /> Create Value Bundle
            </Button>
          )}
          {(addingBundle || editingBundleId) && <BundleForm />}
          {loadingBundles ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading bundles...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.length === 0 ? (
                 <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                   <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
                   <p>No value bundles created yet.</p>
                 </div>
              ) : bundles.map((b: any) => {
                const itemCount = (b.shop_bundle_items || []).length;
                const savings = b.original_price - b.bundle_price;
                const savingsPct = Math.round((savings / b.original_price) * 100);
                
                return (
                  <Card key={b.id} className={`overflow-hidden ${editingBundleId === b.id ? 'border-primary shadow-sm' : ''}`}>
                    {b.image_url && <div className="h-24 w-full"><img src={b.image_url} alt={b.name} className="h-full w-full object-cover" /></div>}
                    <CardContent className="pt-4 pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold">{b.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{itemCount} products included</p>
                        </div>
                        <Badge variant={b.is_active ? "default" : "secondary"} className="shrink-0">{b.is_active ? "Active" : "Hidden"}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase line-through">KES {b.original_price.toLocaleString()}</p>
                          <p className="text-sm font-bold text-primary">KES {b.bundle_price.toLocaleString()}</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs">-{savingsPct}%</Badge>
                      </div>
                      <div className="mt-3 flex gap-2 justify-end border-t pt-3">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => startEditBundle(b)}>
                          <Edit2 className="h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteBundleMutation.mutate(b.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {loadingOrders ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
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
                            <Badge key={i} variant="outline" className="text-xs bg-muted/50">
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
