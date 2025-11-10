import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if admin user already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('role', 'admin')
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Admin user already exists',
          initialized: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create default admin user
    const defaultEmail = 'admin@pawnearn.com'
    const defaultPassword = 'Admin@123456' // User should change this immediately
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: defaultEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator'
      }
    })

    if (authError) {
      throw authError
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: defaultEmail,
        full_name: 'System Administrator',
        referral_code: 'ADMIN-DEFAULT',
        bank_name: 'Default Bank',
        account_name: 'Admin Account',
        bank_account_number: '0000000000'
      })

    if (profileError) {
      throw profileError
    }

    // Assign admin role (should be done by trigger, but ensuring it)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: 'admin'
      })

    if (roleError) {
      throw roleError
    }

    console.log('✅ System initialized successfully')
    console.log(`Admin credentials: ${defaultEmail} / ${defaultPassword}`)

    return new Response(
      JSON.stringify({ 
        message: 'System initialized with default admin user',
        email: defaultEmail,
        note: 'Please change the default password immediately',
        initialized: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Initialization error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
