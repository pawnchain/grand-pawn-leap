import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Crown, Plus, Download, Trash2, ArrowLeft, Upload, Check, TrendingUp, DollarSign, Package, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [triangles, setTriangles] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [newCoupon, setNewCoupon] = useState({ code: "", planType: "" });
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error: any) {
      console.error("Error:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    // Load users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*, user_roles(role)")
      .order("created_at", { ascending: false });
    setUsers(usersData || []);

    // Load coupons
    const { data: couponsData } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons(couponsData || []);

    // Load withdrawals
    const { data: withdrawalsData } = await supabase
      .from("withdrawals")
      .select("*, profiles(full_name, email, bank_account_number, bank_name, account_name)")
      .order("requested_at", { ascending: false });
    setWithdrawals(withdrawalsData || []);

    // Load triangles
    const { data: trianglesData } = await supabase
      .from("triangles")
      .select("*, triangle_members(user_id, level, position)")
      .order("created_at", { ascending: false });
    setTriangles(trianglesData || []);

    // Load plans
    const { data: plansData } = await supabase
      .from("plans")
      .select("*");
    setPlans(plansData || []);

    // Load expenses (we'll create this table if needed)
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    setExpenses(expensesData || []);

    // Calculate analytics
    calculateAnalytics(trianglesData || [], couponsData || [], withdrawalsData || [], plansData || [], expensesData || []);
  };

  const calculateAnalytics = (trianglesData: any[], couponsData: any[], withdrawalsData: any[], plansData: any[], expensesData: any[]) => {
    // Triangle statistics per plan
    const triangleStats: any = {};
    ['king', 'queen', 'prince', 'princess'].forEach(planType => {
      const planTriangles = trianglesData.filter(t => t.plan_type === planType);
      triangleStats[planType] = {
        total: planTriangles.length,
        completed: planTriangles.filter(t => t.is_complete).length,
        open: planTriangles.filter(t => !t.is_complete && t.is_active).length,
      };
    });

    // Financial calculations
    const usedCoupons = couponsData.filter(c => c.used_by !== null);
    const totalCouponValue = usedCoupons.reduce((sum, coupon) => {
      const plan = plansData.find(p => p.type === coupon.plan_type);
      return sum + (plan?.price || 0);
    }, 0);

    const totalPayouts = withdrawalsData
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + Number(w.total_amount), 0);

    const totalExpenses = expensesData.reduce((sum, e) => sum + Number(e.amount), 0);

    const revenue = totalCouponValue;
    const totalCosts = totalPayouts + totalExpenses;
    const netProfitLoss = revenue - totalCosts;

    setAnalytics({
      triangleStats,
      usedCouponsCount: usedCoupons.length,
      totalCouponValue,
      totalPayouts,
      totalExpenses,
      revenue,
      netProfitLoss,
    });
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("coupons")
        .insert([{
          code: newCoupon.code,
          plan_type: newCoupon.planType as any,
          status: "active" as any,
        }]);

      if (error) throw error;

      toast({
        title: "Coupon created!",
        description: "New coupon code has been added.",
      });

      setNewCoupon({ code: "", planType: "" });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "User has been removed from the system.",
      });

      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleUpdateWithdrawalStatus = async (withdrawalId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'processing') {
        updateData.processing_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("withdrawals")
        .update(updateData)
        .eq("id", withdrawalId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Withdrawal marked as ${newStatus}`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSplitTriangle = async (triangleId: string) => {
    if (!confirm("Are you sure you want to split this triangle?")) return;

    try {
      const { error } = await supabase.functions.invoke('split-triangle', {
        body: { triangleId },
      });

      if (error) throw error;

      toast({
        title: "Triangle split!",
        description: "The triangle has been split into two new triangles.",
      });

      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleBulkImportCoupons = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes("code") ? 1 : 0;
      const couponsToImport = [];

      for (let i = startIndex; i < lines.length; i++) {
        const [code, planType] = lines[i].split(",").map(s => s.trim());
        if (code && planType) {
          couponsToImport.push({
            code,
            plan_type: planType.toLowerCase(),
            status: "active" as any,
          });
        }
      }

      const { error } = await supabase
        .from("coupons")
        .insert(couponsToImport);

      if (error) throw error;

      toast({
        title: "Import successful!",
        description: `${couponsToImport.length} coupons imported.`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBulkUpdateWithdrawals = async (newStatus: string) => {
    if (selectedWithdrawals.size === 0) {
      toast({
        variant: "destructive",
        title: "No selection",
        description: "Please select withdrawals to update.",
      });
      return;
    }

    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'processing') {
        updateData.processing_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const promises = Array.from(selectedWithdrawals).map(id =>
        supabase.from("withdrawals").update(updateData).eq("id", id)
      );

      await Promise.all(promises);

      toast({
        title: "Bulk update complete!",
        description: `${selectedWithdrawals.size} withdrawals updated to ${newStatus}.`,
      });

      setSelectedWithdrawals(new Set());
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const toggleWithdrawalSelection = (id: string) => {
    const newSelection = new Set(selectedWithdrawals);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedWithdrawals(newSelection);
  };

  const exportWithdrawals = () => {
    const csv = [
      ["ID", "User", "Email", "Amount", "Status", "Bank", "Account Number", "Account Name", "Date"],
      ...withdrawals.map(w => [
        w.id,
        w.profiles?.full_name || "N/A",
        w.profiles?.email || "N/A",
        `₦${w.total_amount}`,
        w.status,
        w.profiles?.bank_name || "N/A",
        w.profiles?.bank_account_number || "N/A",
        w.profiles?.account_name || "N/A",
        new Date(w.requested_at).toLocaleString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawals_${new Date().toISOString()}.csv`;
    a.click();

    toast({
      title: "Export complete!",
      description: "Withdrawal data has been exported.",
    });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("expenses")
        .insert([{
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
        }]);

      if (error) throw error;

      toast({
        title: "Expense added!",
        description: "New expense has been recorded.",
      });

      setNewExpense({ description: "", amount: "" });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Expense deleted",
        description: "Expense has been removed.",
      });

      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-float" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage users, coupons, and withdrawals</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            size="sm"
            className="border-border/50 self-start sm:self-auto touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card h-auto">
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 sm:py-3">Analytics</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2 sm:py-3">Users</TabsTrigger>
            <TabsTrigger value="coupons" className="text-xs sm:text-sm py-2 sm:py-3">Coupons</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs sm:text-sm py-2 sm:py-3">Withdrawals</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm py-2 sm:py-3">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50 bg-card/95">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <p className="text-2xl font-bold text-green-500">₦{analytics.revenue?.toLocaleString() || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{analytics.usedCouponsCount || 0} coupons used</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/95">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    <p className="text-2xl font-bold text-red-500">₦{analytics.totalPayouts?.toLocaleString() || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Completed withdrawals</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/95">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <p className="text-2xl font-bold text-orange-500">₦{analytics.totalExpenses?.toLocaleString() || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Operational costs</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/95">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <p className={`text-2xl font-bold ${(analytics.netProfitLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ₦{analytics.netProfitLoss?.toLocaleString() || 0}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(analytics.netProfitLoss || 0) >= 0 ? 'Profit' : 'Loss'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Triangle Statistics */}
            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>Triangle Statistics by Plan</CardTitle>
                <CardDescription>Overview of all triangles across different plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['king', 'queen', 'prince', 'princess'].map(planType => (
                    <div key={planType} className="p-4 border border-border/50 rounded-lg">
                      <h3 className="text-lg font-semibold capitalize mb-3 text-primary">{planType}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold">{analytics.triangleStats?.[planType]?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="font-bold text-green-500">{analytics.triangleStats?.[planType]?.completed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Open:</span>
                          <span className="font-bold text-blue-500">{analytics.triangleStats?.[planType]?.open || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Triangles List */}
            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>All Triangles</CardTitle>
                <CardDescription>Complete list of triangles in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triangles.map((triangle) => (
                      <TableRow key={triangle.id}>
                        <TableCell className="font-mono text-xs">{triangle.id.slice(0, 8)}...</TableCell>
                        <TableCell className="capitalize font-medium">{triangle.plan_type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            triangle.is_complete 
                              ? 'bg-green-500/20 text-green-400' 
                              : triangle.is_active
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {triangle.is_complete ? 'Completed' : triangle.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>{triangle.triangle_members?.length || 0}/7</TableCell>
                        <TableCell>{new Date(triangle.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {triangle.completed_at ? new Date(triangle.completed_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="font-mono text-primary">{user.referral_code}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>Add New Coupon</CardTitle>
                <CardDescription>Create a new coupon code for user registration</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCoupon} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Coupon Code</Label>
                      <Input
                        id="code"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        required
                        placeholder="KING2024"
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planType">Plan Type</Label>
                      <Select
                        value={newCoupon.planType}
                        onValueChange={(value) => setNewCoupon({ ...newCoupon, planType: value })}
                        required
                      >
                        <SelectTrigger className="bg-input">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="king">King</SelectItem>
                          <SelectItem value="queen">Queen</SelectItem>
                          <SelectItem value="prince">Prince</SelectItem>
                          <SelectItem value="princess">Princess</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Coupon
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import CSV
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImportCoupons}
                      className="hidden"
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>Existing Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Used By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold text-primary">{coupon.code}</TableCell>
                        <TableCell className="capitalize">{coupon.plan_type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            coupon.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {coupon.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{coupon.used_by ? "Used" : "Available"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="border-border/50 bg-card/95">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Withdrawal Requests</CardTitle>
                  <CardDescription>Process user withdrawal requests</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedWithdrawals.size > 0 && (
                    <>
                      <Button
                        onClick={() => handleBulkUpdateWithdrawals('processing')}
                        variant="outline"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Process Selected ({selectedWithdrawals.size})
                      </Button>
                      <Button
                        onClick={() => handleBulkUpdateWithdrawals('completed')}
                        variant="outline"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Complete Selected ({selectedWithdrawals.size})
                      </Button>
                    </>
                  )}
                  <Button onClick={exportWithdrawals} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedWithdrawals.size === withdrawals.length && withdrawals.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedWithdrawals(new Set(withdrawals.map(w => w.id)));
                            } else {
                              setSelectedWithdrawals(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bank Details</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedWithdrawals.has(withdrawal.id)}
                            onCheckedChange={() => toggleWithdrawalSelection(withdrawal.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-accent">₦{withdrawal.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                            withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{withdrawal.profiles?.bank_name}</p>
                            <p className="font-mono">{withdrawal.profiles?.bank_account_number}</p>
                            <p className="text-muted-foreground">{withdrawal.profiles?.account_name}</p>
                            {withdrawal.telegram_username && (
                              <p className="text-primary">TG: {withdrawal.telegram_username}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(withdrawal.requested_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            {withdrawal.status === 'pending' && (
                              <Button
                                onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'processing')}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                Start Processing
                              </Button>
                            )}
                            {withdrawal.status === 'processing' && (
                              <Button
                                onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'completed')}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>Track operational costs and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        required
                        placeholder="Server costs, marketing, etc."
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        required
                        placeholder="5000"
                        className="bg-input"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/95">
              <CardHeader>
                <CardTitle>Expense History</CardTitle>
                <CardDescription>Total Expenses: ₦{analytics.totalExpenses?.toLocaleString() || 0}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="font-bold text-orange-500">₦{Number(expense.amount).toLocaleString()}</TableCell>
                        <TableCell>{new Date(expense.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeleteExpense(expense.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
