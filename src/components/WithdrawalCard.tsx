import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export function WithdrawalCard({ userId }: { userId: string }) {
  const [withdrawal, setWithdrawal] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"rejoin" | "complaint" | null>(null);
  const [formData, setFormData] = useState({
    couponCode: "",
    accountNumber: "",
    accountName: "",
    telegram: "",
    complaint: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawal();
  }, [userId]);

  useEffect(() => {
    if (withdrawal?.status === "processing" && withdrawal?.processing_at) {
      const interval = setInterval(() => {
        const processingTime = new Date(withdrawal.processing_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const completionTime = processingTime + twentyFourHours;
        const now = Date.now();
        const remaining = completionTime - now;

        if (remaining <= 0) {
          setTimeLeft("Ready for confirmation");
          clearInterval(interval);
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [withdrawal]);

  const loadWithdrawal = async () => {
    try {
      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false })
        .limit(1)
        .single();

      setWithdrawal(data);
    } catch (error) {
      console.error("Error loading withdrawal:", error);
    }
  };

  const handleConfirmReceived = async () => {
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", withdrawal.id);

      if (error) throw error;

      toast({
        title: "Confirmed!",
        description: "Withdrawal marked as received.",
      });

      setShowForm(true);
      setFormType("rejoin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleNotReceived = () => {
    setShowForm(true);
    setFormType("complaint");
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formType === "rejoin") {
        // Just store the coupon code for rejoin
        await supabase
          .from("withdrawals")
          .update({ new_coupon_code: formData.couponCode })
          .eq("id", withdrawal.id);

        toast({
          title: "Rejoin request submitted!",
          description: "You'll be added to a new triangle soon.",
        });
      } else if (formType === "complaint") {
        await supabase
          .from("withdrawals")
          .update({
            complaint_submitted: true,
            complaint_details: {
              account_number: formData.accountNumber,
              account_name: formData.accountName,
              telegram: formData.telegram,
              complaint: formData.complaint,
            },
          })
          .eq("id", withdrawal.id);

        toast({
          title: "Complaint submitted",
          description: "Admin will contact you via Telegram.",
        });
      }

      setShowForm(false);
      await loadWithdrawal();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (!withdrawal) {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Withdrawals
          </CardTitle>
          <CardDescription>Complete your triangle to withdraw earnings</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No withdrawal requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Withdrawal Status
        </CardTitle>
        <CardDescription>Track your withdrawal request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold text-accent">₦{withdrawal.total_amount.toLocaleString()}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${
            withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
            withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
            withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            <p className="text-sm font-semibold capitalize">{withdrawal.status}</p>
          </div>
        </div>

        {withdrawal.status === "processing" && timeLeft && timeLeft !== "Ready for confirmation" && (
          <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20">
            <Clock className="w-12 h-12 mx-auto mb-3 text-primary animate-float" />
            <p className="text-sm text-muted-foreground mb-2">Processing Time Remaining</p>
            <p className="text-3xl font-mono font-bold text-primary">{timeLeft}</p>
          </div>
        )}

        {withdrawal.status === "processing" && timeLeft === "Ready for confirmation" && !showForm && (
          <div className="space-y-3">
            <p className="text-center text-muted-foreground mb-4">
              Has the withdrawal been received in your account?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleConfirmReceived}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Received
              </Button>
              <Button
                onClick={handleNotReceived}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Not Received
              </Button>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmitForm} className="space-y-4 p-4 rounded-lg bg-muted/30">
            {formType === "rejoin" ? (
              <>
                <h3 className="font-semibold text-lg">Rejoin Triangle</h3>
                <div className="space-y-2">
                  <Label htmlFor="couponCode">Enter New Coupon Code</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    required
                    placeholder="Enter coupon code"
                    className="bg-input"
                  />
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg text-destructive">Report Issue</h3>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Bank Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    required
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    required
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram Username</Label>
                  <Input
                    id="telegram"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    required
                    placeholder="@username"
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complaint">Details</Label>
                  <Textarea
                    id="complaint"
                    value={formData.complaint}
                    onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                    required
                    placeholder="Describe the issue..."
                    className="bg-input min-h-[100px]"
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Submit
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
