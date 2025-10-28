import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JoinTriangleRequest {
  userId: string
  planType: string
  referralCode?: string
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

    const { userId, planType, referralCode }: JoinTriangleRequest = await req.json()

    console.log('Join triangle request:', { userId, planType, referralCode })

    let targetTriangleId: string | null = null

    // If referral code provided, try to join referee's triangle
    if (referralCode) {
      const { data: referrer } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (referrer) {
        // Find referee's active triangle
        const { data: refereeMembership } = await supabaseClient
          .from('triangle_members')
          .select('triangle_id, triangles!inner(plan_type, is_active, is_complete)')
          .eq('user_id', referrer.id)
          .eq('triangles.is_active', true)
          .eq('triangles.is_complete', false)
          .eq('triangles.plan_type', planType)
          .order('joined_at', { ascending: false })
          .limit(1)
          .single()

        if (refereeMembership) {
          // Check if triangle has space
          const { count: memberCount } = await supabaseClient
            .from('triangle_members')
            .select('*', { count: 'exact', head: true })
            .eq('triangle_id', refereeMembership.triangle_id)

          if (memberCount !== null && memberCount < 15) {
            targetTriangleId = refereeMembership.triangle_id
            
            // Record referral bonus
            await supabaseClient
              .from('referrals')
              .insert({
                referrer_id: referrer.id,
                referred_id: userId,
                bonus_amount: 0, // Will be calculated later
              })
          }
        }
      }
    }

    // If no triangle from referral, find oldest available triangle
    if (!targetTriangleId) {
      const { data: availableTriangles } = await supabaseClient
        .from('triangles')
        .select('id')
        .eq('plan_type', planType)
        .eq('is_active', true)
        .eq('is_complete', false)
        .order('created_at', { ascending: true })
        .limit(10)

      // Find first triangle with less than 15 members
      for (const triangle of availableTriangles || []) {
        const { count } = await supabaseClient
          .from('triangle_members')
          .select('*', { count: 'exact', head: true })
          .eq('triangle_id', triangle.id)

        if ((count || 0) < 15) {
          targetTriangleId = triangle.id
          break
        }
      }
    }

    // If still no triangle, create new one
    if (!targetTriangleId) {
      const { data: newTriangle, error: createError } = await supabaseClient
        .from('triangles')
        .insert({
          plan_type: planType,
          is_active: true,
          is_complete: false,
        })
        .select()
        .single()

      if (createError) throw createError
      targetTriangleId = newTriangle.id
    }

    // Get current member count to determine level and position
    const { data: existingMembers } = await supabaseClient
      .from('triangle_members')
      .select('level, position')
      .eq('triangle_id', targetTriangleId)
      .order('level', { ascending: true })
      .order('position', { ascending: true })

    let level = 1
    let position = 0

    if (existingMembers && existingMembers.length > 0) {
      // Calculate next position
      const totalMembers = existingMembers.length
      if (totalMembers === 1) {
        level = 2
        position = 0
      } else if (totalMembers < 3) {
        level = 2
        position = totalMembers - 1
      } else if (totalMembers < 7) {
        level = 3
        position = totalMembers - 3
      } else if (totalMembers < 15) {
        level = 4
        position = totalMembers - 7
      }
    }

    // Add user to triangle
    const { error: memberError } = await supabaseClient
      .from('triangle_members')
      .insert({
        triangle_id: targetTriangleId,
        user_id: userId,
        level,
        position,
      })

    if (memberError) throw memberError

    // Check if triangle is now complete (15 members)
    const { count: finalCount } = await supabaseClient
      .from('triangle_members')
      .select('*', { count: 'exact', head: true })
      .eq('triangle_id', targetTriangleId)

    if (finalCount === 15) {
      // Mark triangle as complete
      await supabaseClient
        .from('triangles')
        .update({ is_complete: true, completed_at: new Date().toISOString() })
        .eq('id', targetTriangleId)

      // Trigger payout for top user (level 1, position 0)
      const { data: topUser } = await supabaseClient
        .from('triangle_members')
        .select('id, user_id')
        .eq('triangle_id', targetTriangleId)
        .eq('level', 1)
        .eq('position', 0)
        .single()

      if (topUser) {
        // Get triangle and plan details
        const { data: triangle } = await supabaseClient
          .from('triangles')
          .select('plan_type')
          .eq('id', targetTriangleId)
          .single()

        if (triangle) {
          // Get plan details separately
          const { data: plan } = await supabaseClient
            .from('plans')
            .select('payout')
            .eq('type', triangle.plan_type)
            .single()

          if (plan) {
            // Create withdrawal
            await supabaseClient
              .from('withdrawals')
              .insert({
                user_id: topUser.user_id,
                triangle_member_id: topUser.id,
                amount: plan.payout,
                referral_bonus: 0,
                total_amount: plan.payout,
                status: 'pending',
              })

            // Mark member as paid out
            await supabaseClient
              .from('triangle_members')
              .update({ is_paid_out: true })
              .eq('id', topUser.id)
          }
        }
      }
    }

    console.log('User joined triangle successfully:', { targetTriangleId, level, position })

    return new Response(
      JSON.stringify({ 
        success: true, 
        triangleId: targetTriangleId,
        level,
        position 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error joining triangle:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
