import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, Users, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDIxNSwgMCwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <Crown className="w-24 h-24 mx-auto mb-8 text-primary animate-float" />
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              PawnEarn
            </h1>
            <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The chess-themed earning platform. Strategic moves lead to royal rewards.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 animate-glow-pulse"
            >
              Enter the Game
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 animate-slide-up">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-3 text-foreground">4x Returns</h3>
            <p className="text-muted-foreground">
              Earn 4 times your investment when your triangle completes
            </p>
          </div>

          <div className="text-center p-8 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Users className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h3 className="text-xl font-bold mb-3 text-foreground">Referral Bonuses</h3>
            <p className="text-muted-foreground">
              Get 10% bonus for every friend you refer to the platform
            </p>
          </div>

          <div className="text-center p-8 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Shield className="w-12 h-12 mx-auto mb-4 text-secondary" />
            <h3 className="text-xl font-bold mb-3 text-foreground">Secure System</h3>
            <p className="text-muted-foreground">
              Transparent triangle structure with automated payouts
            </p>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-foreground">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Princess", price: "10,000", payout: "40,000", icon: "♕" },
            { name: "Prince", price: "20,000", payout: "80,000", icon: "♚" },
            { name: "Queen", price: "50,000", payout: "200,000", icon: "♛" },
            { name: "King", price: "100,000", payout: "400,000", icon: "👑" },
          ].map((plan, idx) => (
            <div
              key={plan.name}
              className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all hover:scale-105 animate-scale-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-4xl mb-4 text-center">{plan.icon}</div>
              <h3 className="text-2xl font-bold text-center mb-2 text-foreground">{plan.name}</h3>
              <p className="text-center text-muted-foreground mb-4">Investment</p>
              <p className="text-3xl font-bold text-center text-primary mb-4">₦{plan.price}</p>
              <p className="text-center text-muted-foreground mb-2">Payout</p>
              <p className="text-2xl font-bold text-center text-accent">₦{plan.payout}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-6 text-foreground">Ready to Make Your Move?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of players earning through strategic triangle completion
        </p>
        <Button
          onClick={() => navigate("/auth")}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6"
        >
          Get Started Now
        </Button>
      </div>
    </div>
  );
};

export default Index;
