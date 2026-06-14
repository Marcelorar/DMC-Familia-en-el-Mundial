import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { match_id, home_score, away_score, change_request_id } = await req.json()

    if (!match_id || home_score == null || away_score == null) {
      return new Response(
        JSON.stringify({ error: 'match_id, home_score and away_score are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Update the match to completed with final scores
    const { error: matchError } = await supabase
      .from('matches')
      .update({ status: 'completed', home_score, away_score })
      .eq('id', match_id)

    if (matchError) {
      console.log('[DEBUG] step=update_match error:', matchError.message)
      return new Response(
        JSON.stringify({ error: `update_match: ${matchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Grade all predictions for this match
    const { error: gradeError } = await supabase.rpc('grade_predictions', { p_match_id: match_id })

    if (gradeError) {
      console.log('[DEBUG] step=grade_predictions error:', gradeError.message)
      return new Response(
        JSON.stringify({ error: `grade_predictions: ${gradeError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Mark the change request as approved (if provided)
    if (change_request_id) {
      await supabase
        .from('match_change_requests')
        .update({ status: 'approved' })
        .eq('id', change_request_id)
    }

    return new Response(
      JSON.stringify({ success: true, match_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
