import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, CheckCircle, School, Package } from "lucide-react";

const PAYMENT_METHODS = [
  { key: "pay_at_school", label: "Pay at School Office", description: "Bring payment when collecting your order" },
  { key: "mpesa", label: "M-Pesa (Coming Soon)", description: "Mobile money — integration in progress", disabled: true },
  { key: "card", label: "Card / Online (Coming Soon)", description: "Visa, Mastercard — integration in progress", disabled: true },
];

const ShopCheckout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("pay_at_school");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: profile?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("shop_orders")
        .insert({
          user_id: user?.id ?? null,
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim() || null,
          payment_method: paymentMethod,
          total: totalPrice,
          notes: form.notes.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const lineItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.type === "product" ? item.id : null,
        bundle_id: item.type === "bundle" ? item.id : null,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        variant: item.variant ?? null,
      }));
      const { error: itemsErr } = await supabase.from("shop_order_items").insert(lineItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      setOrderId(order.id);
      setDone(true);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold font-display">Order Placed!</h2>
            <p className="text-muted-foreground">
              Thank you for your order. {paymentMethod === "pay_at_school"
                ? "Please bring payment when you collect your items from the school office."
                : "Your order has been received."}
            </p>
            {orderId && (
              <p className="text-sm text-muted-foreground">
                Order reference: <span className="font-mono font-semibold text-foreground">{orderId.slice(0, 8).toUpperCase()}</span>
              </p>
            )}
            <div className="flex gap-3 justify-center flex-wrap pt-2">
              <Button variant="outline" asChild><Link to="/shop">Continue Shopping</Link></Button>
              {user && <Button asChild><Link to="/dashboard/orders">View My Orders</Link></Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-14 w-14 mx-auto text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button asChild><Link to="/shop">Go to Shop</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/95">
        <div className="container h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/shop"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop</Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium">Checkout</span>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Your Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Full Name *</Label>
                    <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.key}
                    disabled={pm.disabled}
                    onClick={() => !pm.disabled && setPaymentMethod(pm.key)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors ${
                      paymentMethod === pm.key ? "border-primary bg-primary/5" : "border-border"
                    } ${pm.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === pm.key ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {paymentMethod === pm.key && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{pm.label}</p>
                          <p className="text-xs text-muted-foreground">{pm.description}</p>
                        </div>
                      </div>
                      {pm.key === "pay_at_school" && <School className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variant}`} className="flex gap-3 text-sm">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover rounded" />
                        : <Package className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                      <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    </div>
                    <p className="font-semibold shrink-0">KES {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items ({totalItems})</span>
                  <span>KES {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">KES {totalPrice.toLocaleString()}</span>
                </div>
                <Button className="w-full mt-2" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By placing this order you agree to our terms of sale.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCheckout;
