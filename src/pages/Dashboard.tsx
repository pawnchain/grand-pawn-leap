import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, LogOut, Users, TrendingUp, Crown } from "lucide-react";
import { TriangleView } from "@/components/TriangleView";
import { WithdrawalCard } from "@/components/WithdrawalCard";

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roleData);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Crown className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8 pb-safe">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-float" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">PawnEarn Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                size="sm"
                className="border-primary/50 hover:bg-primary/10 flex-1 sm:flex-none"
              >
                Admin Panel
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-destructive/50 hover:bg-destructive/10 flex-1 sm:flex-none"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">Referral Code</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-mono text-primary break-all">
              {profile?.referral_code}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={copyReferralCode}
              variant="outline"
              size="sm"
              className="w-full border-primary/50 hover:bg-primary/10 touch-manipulation"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground">
              <Users className="w-4 h-4 inline mr-1" />
              Total Referrals
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Share your code to earn bonuses</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Pending Earnings
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-accent">
              ₦0.00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Complete triangle to withdraw</p>
          </CardContent>
        </Card>
      </div>

      {/* Triangle View */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <TriangleView userId={profile?.id} />
      </div>

      {/* Withdrawal Section */}
      <div className="max-w-7xl mx-auto mb-safe">
        <WithdrawalCard userId={profile?.id} />
      </div>
    </div>
  );
}
