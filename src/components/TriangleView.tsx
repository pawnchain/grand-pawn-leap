import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, User } from "lucide-react";

interface TriangleMember {
  level: number;
  position: number;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export function TriangleView({ userId }: { userId: string }) {
  const [members, setMembers] = useState<TriangleMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTriangle();
  }, [userId]);

  const loadTriangle = async () => {
    try {
      // Find user's triangle
      const { data: memberData } = await supabase
        .from("triangle_members")
        .select("triangle_id")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(1)
        .single();

      if (!memberData) {
        setLoading(false);
        return;
      }

      // Get all members in this triangle
      const { data: triangleMembers } = await supabase
        .from("triangle_members")
        .select("*, profiles(full_name)")
        .eq("triangle_id", memberData.triangle_id)
        .order("level")
        .order("position");

      setMembers(triangleMembers || []);
    } catch (error) {
      console.error("Error loading triangle:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMembersByLevel = (level: number) => {
    return members.filter(m => m.level === level);
  };

  const renderTriangleLevel = (level: number, count: number) => {
    const levelMembers = getMembersByLevel(level);
    const emptySlots = count - levelMembers.length;

    return (
      <div className="flex justify-center gap-2 mb-4" style={{ animationDelay: `${level * 0.1}s` }}>
        {levelMembers.map((member, idx) => (
          <div
            key={idx}
            className={`
              w-16 h-16 rounded-lg flex flex-col items-center justify-center
              transition-all duration-300 hover:scale-110 animate-scale-in
              ${member.user_id === userId 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50 animate-glow-pulse' 
                : 'bg-card border border-border'
              }
            `}
            style={{ animationDelay: `${(level * 0.1) + (idx * 0.05)}s` }}
          >
            {level === 1 ? (
              <Crown className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
            <span className="text-[10px] mt-1 truncate w-full text-center px-1">
              {member.profiles?.full_name?.split(' ')[0] || 'User'}
            </span>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-border/30 flex items-center justify-center animate-fade-in"
            style={{ animationDelay: `${(level * 0.1) + ((levelMembers.length + idx) * 0.05)}s` }}
          >
            <User className="w-6 h-6 text-muted-foreground/30" />
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Crown className="w-8 h-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Your Triangle
        </CardTitle>
        <CardDescription>
          {members.length === 0 
            ? "You'll be placed in a triangle soon" 
            : `${members.length} / 15 members`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Crown className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Waiting to be placed in a triangle...</p>
          </div>
        ) : (
          <div className="py-8">
            {renderTriangleLevel(1, 1)}
            {renderTriangleLevel(2, 2)}
            {renderTriangleLevel(3, 4)}
            {renderTriangleLevel(4, 8)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
