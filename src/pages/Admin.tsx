import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Crown, Plus, Download, Trash2, ArrowLeft, Upload, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: "", planType: "" });
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

        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card h-auto">
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2 sm:py-3">Users</TabsTrigger>
            <TabsTrigger value="coupons" className="text-xs sm:text-sm py-2 sm:py-3">Coupons</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs sm:text-sm py-2 sm:py-3">Withdrawals</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
}
