import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  fulfilled: "default",
  cancelled: "destructive",
};

const OrderHistoryPage = () => {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, shop_order_items(item_name, quantity, unit_price, variant)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and review your purchases from the school shop.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
          <ShoppingBag className="h-14 w-14 opacity-25" />
          <p>You haven't placed any orders yet</p>
          <Button asChild><Link to="/shop">Browse Shop</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"} className="capitalize">{o.status}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{o.payment_method.replace(/_/g, " ")}</p>
                    <div className="mt-2 space-y-1">
                      {(o.shop_order_items ?? []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{item.item_name}{item.variant ? ` — ${item.variant}` : ""}</span>
                          <span className="text-muted-foreground">×{item.quantity}</span>
                          <span className="text-muted-foreground text-xs">KES {(Number(item.unit_price) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {o.status === "pending" && o.payment_method === "pay_at_school" && (
                      <p className="text-xs text-muted-foreground mt-2 italic">Please bring payment when collecting from the school office.</p>
                    )}
                  </div>
                  <p className="font-bold text-primary text-lg">KES {Number(o.total).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
