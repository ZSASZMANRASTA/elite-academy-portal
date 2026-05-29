import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  ShoppingCart, Package, Search, Plus, Minus, Trash2, ArrowRight, Gift
} from "lucide-react";

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
            <div key={`${item.id}-${item.variant || 'default'}`} className="flex gap-3 rounded-lg border p-3">
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
  const { addItem } = useCart();
  const [search, setSearch] = useState("");

  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ["shop-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_bundles")
        .select("*, shop_bundle_items(*, shop_products(*))")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredBundles = useMemo(() => {
    let list = bundles;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b: any) => 
        b.name.toLowerCase().includes(q) || 
        b.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bundles, search]);

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
              <h1 className="font-display text-3xl font-bold text-foreground">School Packages</h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Select the complete requirements bundle for your student's grade. Fast, simple, and everything they need in one click.
              </p>
            </div>
            <CartSidebar />
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search bundles (e.g., Grade 4)..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* Bundles Grid */}
        <div>
          {loadingBundles ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse border-primary/20 bg-primary/5">
                  <div className="h-40 bg-muted" />
                  <CardContent className="pt-4 pb-2 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </CardContent>
                  <CardFooter className="pt-2 pb-4">
                    <div className="h-8 bg-muted rounded w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredBundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              <Gift className="h-12 w-12 mb-3 opacity-30" />
              <p>No bundles found</p>
              {search && (
                <button className="text-primary text-sm mt-2 hover:underline" onClick={() => setSearch("")}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBundles.map((b: any) => {
                const savings = b.original_price - b.bundle_price;
                const savingsPct = Math.round((savings / b.original_price) * 100);
                const contents = (b.shop_bundle_items ?? [])
                  .map((bi: any) => bi.shop_products?.name)
                  .filter(Boolean);

                return (
                  <Card key={b.id} className="overflow-hidden border-primary/20 bg-primary/5 hover:shadow-md transition-shadow">
                    <div className="relative h-40 bg-primary/10 flex items-center justify-center overflow-hidden">
                      {b.image_url ? (
                        <img src={b.image_url} alt={b.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Gift className="h-14 w-14 text-primary/40" />
                      )}
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                        Save {savingsPct}%
                      </Badge>
                    </div>
                    <CardContent className="pt-4 pb-2">
                      <h3 className="font-semibold text-base">{b.name}</h3>
                      {b.description && <p className="text-sm text-muted-foreground mt-1">{b.description}</p>}
                      {contents.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                          <span className="font-medium text-foreground">Includes:</span> {contents.join(" · ")}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-2 pb-4">
                      <div>
                        <p className="text-xs text-muted-foreground line-through">KES {b.original_price.toLocaleString()}</p>
                        <p className="text-lg font-bold text-primary">KES {b.bundle_price.toLocaleString()}</p>
                      </div>
                      <Button size="sm" onClick={() => handleAddBundle(b)} className="gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
