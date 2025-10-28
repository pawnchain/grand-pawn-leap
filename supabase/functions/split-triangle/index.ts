import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SplitTriangleRequest {
  triangleId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { triangleId }: SplitTriangleRequest = await req.json()

    console.log('Splitting triangle:', triangleId)

    // Get all members except top user (level 1, position 0)
    const { data: members } = await supabaseClient
      .from('triangle_members')
      .select('*')
      .eq('triangle_id', triangleId)
      .not('level', 'eq', 1)
      .order('level')
      .order('position')

    if (!members || members.length === 0) {
      throw new Error('No members to split')
    }

    // Get triangle details
    const { data: triangle } = await supabaseClient
      .from('triangles')
      .select('plan_type')
      .eq('id', triangleId)
      .single()

    if (!triangle) throw new Error('Triangle not found')

    // Split members into left (positions 0) and right (positions 1) from level 2
    const leftMembers = members.filter(m => 
      (m.level === 2 && m.position === 0) || 
      (m.level === 3 && (m.position === 0 || m.position === 1)) ||
      (m.level === 4 && (m.position <= 3))
    )

    const rightMembers = members.filter(m => 
      (m.level === 2 && m.position === 1) || 
      (m.level === 3 && (m.position === 2 || m.position === 3)) ||
      (m.level === 4 && (m.position >= 4))
    )

    // Create two new triangles
    const { data: leftTriangle } = await supabaseClient
      .from('triangles')
      .insert({
        plan_type: triangle.plan_type,
        is_active: true,
        is_complete: false,
        parent_triangle_id: triangleId,
        split_side: 'left',
      })
      .select()
      .single()

    const { data: rightTriangle } = await supabaseClient
      .from('triangles')
      .insert({
        plan_type: triangle.plan_type,
        is_active: true,
        is_complete: false,
        parent_triangle_id: triangleId,
        split_side: 'right',
      })
      .select()
      .single()

    if (!leftTriangle || !rightTriangle) throw new Error('Failed to create new triangles')

    // Promote left members
    const leftPromotions = [
      { oldLevel: 2, oldPos: 0, newLevel: 1, newPos: 0 },
      { oldLevel: 3, oldPos: 0, newLevel: 2, newPos: 0 },
      { oldLevel: 3, oldPos: 1, newLevel: 2, newPos: 1 },
      { oldLevel: 4, oldPos: 0, newLevel: 3, newPos: 0 },
      { oldLevel: 4, oldPos: 1, newLevel: 3, newPos: 1 },
      { oldLevel: 4, oldPos: 2, newLevel: 3, newPos: 2 },
      { oldLevel: 4, oldPos: 3, newLevel: 3, newPos: 3 },
    ]

    for (const member of leftMembers) {
      const promotion = leftPromotions.find(p => p.oldLevel === member.level && p.oldPos === member.position)
      if (promotion) {
        await supabaseClient
          .from('triangle_members')
          .insert({
            triangle_id: leftTriangle.id,
            user_id: member.user_id,
            level: promotion.newLevel,
            position: promotion.newPos,
          })
      }
    }

    // Promote right members
    const rightPromotions = [
      { oldLevel: 2, oldPos: 1, newLevel: 1, newPos: 0 },
      { oldLevel: 3, oldPos: 2, newLevel: 2, newPos: 0 },
      { oldLevel: 3, oldPos: 3, newLevel: 2, newPos: 1 },
      { oldLevel: 4, oldPos: 4, newLevel: 3, newPos: 0 },
      { oldLevel: 4, oldPos: 5, newLevel: 3, newPos: 1 },
      { oldLevel: 4, oldPos: 6, newLevel: 3, newPos: 2 },
      { oldLevel: 4, oldPos: 7, newLevel: 3, newPos: 3 },
    ]

    for (const member of rightMembers) {
      const promotion = rightPromotions.find(p => p.oldLevel === member.level && p.oldPos === member.position)
      if (promotion) {
        await supabaseClient
          .from('triangle_members')
          .insert({
            triangle_id: rightTriangle.id,
            user_id: member.user_id,
            level: promotion.newLevel,
            position: promotion.newPos,
          })
      }
    }

    // Deactivate old triangle
    await supabaseClient
      .from('triangles')
      .update({ is_active: false })
      .eq('id', triangleId)

    console.log('Triangle split successfully:', { leftTriangle: leftTriangle.id, rightTriangle: rightTriangle.id })

    return new Response(
      JSON.stringify({ 
        success: true, 
        leftTriangleId: leftTriangle.id,
        rightTriangleId: rightTriangle.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error splitting triangle:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
