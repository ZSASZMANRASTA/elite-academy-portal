import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ShoppingCart, Package, Download, Tag, Heart, Gift, Search,
  Plus, Minus, Trash2, ArrowRight, BookOpen, Shirt, Pencil, Ticket,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All Items", icon: Package },
  { key: "uniforms", label: "Uniforms", icon: Shirt },
  { key: "stationery", label: "Stationery", icon: Pencil },
  { key: "digital", label: "Digital Resources", icon: Download },
  { key: "events", label: "Event Tickets", icon: Ticket },
  { key: "donations", label: "Donate", icon: Heart },
];

const STATUS_COLORS: Record<string, string> = {
  uniforms: "bg-blue-100 text-blue-700",
  stationery: "bg-green-100 text-green-700",
  digital: "bg-purple-100 text-purple-700",
  events: "bg-orange-100 text-orange-700",
  donations: "bg-pink-100 text-pink-700",
};

const CartSidebar = () => {
  const { items, totalItems, totalPrice, removeItem, updateQty } = useCart();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <ShoppingCart className="h-4 w-4" />
          Cart
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Your Cart
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
              <p>Your cart is empty</p>
            </div>
          ) : items.map((item) => (
            <div key={`${item.id}-${item.variant}`} className="flex gap-3 rounded-lg border p-3">
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover rounded-md" />
                  : <Package className="h-5 w-5 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                <p className="text-sm font-semibold text-primary mt-0.5">KES {(item.price * item.quantity).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeItem(item.id, item.variant)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.id, item.variant, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.id, item.variant, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
              <span className="font-semibold">KES {totalPrice.toLocaleString()}</span>
            </div>
            <Button className="w-full gap-2" asChild>
              <Link to="/shop/checkout">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Shop = () => {
  const { addItem, totalItems } = useCart();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_products").select("*").eq("is_active", true).order("category").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ["shop-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_bundles").select("*, shop_bundle_items(*, shop_products(*))").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") list = list.filter((p: any) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategory, search]);

  const handleAddProduct = (p: any) => {
    const variants: any[] = p.variants ?? [];
    const variant = selectedVariants[p.id];
    if (variants.length > 0 && !variant) {
      toast.error("Please select a size/variant");
      return;
    }
    if (p.is_donation) {
      addItem({ id: p.id, type: "product", name: p.name, price: p.price, image_url: p.image_url });
      toast.success("Thank you for your generosity! Added to cart.");
      return;
    }
    addItem({ id: p.id, type: "product", name: p.name, price: p.price, variant, image_url: p.image_url });
    toast.success(`${p.name} added to cart`);
  };

  const handleAddBundle = (b: any) => {
    addItem({ id: b.id, type: "bundle", name: b.name, price: b.bundle_price, image_url: b.image_url });
    toast.success(`${b.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary/5 border-b">
        <div className="container py-12">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">School Shop</h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Uniforms, stationery, digital resources, event tickets, and more — all in one place.
              </p>
            </div>
            <CartSidebar />
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border ${
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bundles — show at top when "all" or if matching */}
        {(activeCategory === "all") && bundles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Value Bundles</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((b: any) => {
                const savings = b.original_price - b.bundle_price;
                const savingsPct = Math.round((savings / b.original_price) * 100);
                const contents = (b.shop_bundle_items ?? []).map((bi: any) => bi.shop_products?.name).filter(Boolean);
                return (
                  <Card key={b.id} className="overflow-hidden border-primary/20 bg-primary/5">
                    <div className="relative h-40 bg-primary/10 flex items-center justify-center">
                      {b.image_url
                        ? <img src={b.image_url} alt={b.name} className="h-full w-full object-cover" />
                        : <Gift className="h-14 w-14 text-primary/40" />
                      }
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">Save {savingsPct}%</Badge>
                    </div>
                    <CardContent className="pt-4 pb-2">
                      <h3 className="font-semibold text-base">{b.name}</h3>
                      {b.description && <p className="text-sm text-muted-foreground mt-1">{b.description}</p>}
                      {contents.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">Includes: {contents.join(" · ")}</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-0 pb-4">
                      <div>
                        <p className="text-xs text-muted-foreground line-through">KES {b.original_price.toLocaleString()}</p>
                        <p className="text-lg font-bold text-primary">KES {b.bundle_price.toLocaleString()}</p>
                      </div>
                      <Button size="sm" onClick={() => handleAddBundle(b)} className="gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5" /> Add
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Products grid */}
        <div>
          {activeCategory !== "all" && (
            <h2 className="text-lg font-semibold mb-4">
              {CATEGORIES.find((c) => c.key === activeCategory)?.label}
              {!loadingProducts && <span className="text-sm font-normal text-muted-foreground ml-2">({filtered.length} items)</span>}
            </h2>
          )}

          {loadingProducts ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-44 bg-muted" />
                  <CardContent className="pt-3 pb-2 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p>No items found</p>
              {search && <button className="text-primary text-sm mt-2" onClick={() => setSearch("")}>Clear search</button>}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p: any) => {
                const variants: any[] = p.variants ?? [];
                const selectedVariant = selectedVariants[p.id];
                const selectedVariantObj = variants.find((v) => v.size === selectedVariant);
                const outOfStock = !p.is_digital && !p.is_donation && p.stock_quantity <= 0 &&
                  (variants.length === 0 || (selectedVariantObj && selectedVariantObj.stock <= 0));

                return (
                  <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="relative h-44 bg-muted flex items-center justify-center overflow-hidden">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            {p.category === "uniforms" && <Shirt className="h-12 w-12 opacity-30" />}
                            {p.category === "stationery" && <Pencil className="h-12 w-12 opacity-30" />}
                            {p.category === "digital" && <Download className="h-12 w-12 opacity-30" />}
                            {p.category === "donations" && <Heart className="h-12 w-12 opacity-30" />}
                            {p.category === "events" && <Ticket className="h-12 w-12 opacity-30" />}
                            {!["uniforms","stationery","digital","donations","events"].includes(p.category) && <Package className="h-12 w-12 opacity-30" />}
                          </div>
                        )
                      }
                      <Badge className={`absolute top-2 left-2 text-xs ${STATUS_COLORS[p.category] ?? ""}`}>
                        {CATEGORIES.find((c) => c.key === p.category)?.label ?? p.category}
                      </Badge>
                      {p.is_digital && <Badge className="absolute top-2 right-2 bg-purple-600 text-white text-xs">Digital</Badge>}
                      {p.is_donation && <Badge className="absolute top-2 right-2 bg-pink-600 text-white text-xs">Donation</Badge>}
                    </div>
                    <CardContent className="pt-3 pb-2">
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                      {!p.is_donation && (
                        <p className="text-base font-bold text-primary mt-2">KES {Number(p.price).toLocaleString()}</p>
                      )}
                      {p.is_donation && (
                        <p className="text-sm text-muted-foreground mt-2">Any amount</p>
                      )}
                      {!p.is_digital && !p.is_donation && variants.length === 0 && p.stock_quantity > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{p.stock_quantity} in stock</p>
                      )}
                      {/* Variant selector */}
                      {variants.length > 0 && (
                        <div className="mt-2">
                          <Select
                            value={selectedVariants[p.id] ?? ""}
                            onValueChange={(v) => setSelectedVariants((prev) => ({ ...prev, [p.id]: v }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {variants.map((v: any) => (
                                <SelectItem key={v.size} value={v.size} disabled={v.stock <= 0}>
                                  {v.size} {v.stock > 0 ? `(${v.stock} left)` : "(Out of stock)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 pb-3">
                      <Button
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => handleAddProduct(p)}
                        disabled={outOfStock}
                        variant={p.is_donation ? "outline" : "default"}
                      >
                        {p.is_donation ? <Heart className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                        {outOfStock ? "Out of stock" : p.is_donation ? "Donate" : p.is_digital ? "Buy & Download" : "Add to Cart"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Digital Resource Library note for guests */}
        {(activeCategory === "all" || activeCategory === "digital") && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900 p-6 flex items-start gap-4">
            <BookOpen className="h-8 w-8 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-300">Digital Resource Library</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                Purchase revision papers, past exam packs, and school handbooks for download. Enrolled students get free access to all materials through their student dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
