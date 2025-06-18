
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { publicIds } = await req.json()

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid publicIds array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Cloudinary credentials from Supabase secrets
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY')
    const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
    
    if (!cloudinaryApiSecret || !cloudinaryApiKey || !cloudinaryCloudName) {
      console.error('Missing Cloudinary credentials in environment')
      return new Response(
        JSON.stringify({ error: 'Cloudinary credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate timestamp for signed deletion (in seconds, not milliseconds)
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // Create signature for signed deletion
    const crypto = await import("https://deno.land/std@0.177.0/crypto/mod.ts")
    
    // Create signature string for bulk deletion
    const publicIdsString = publicIds.join(',')
    const signatureString = `public_ids=${publicIdsString}&timestamp=${timestamp}${cloudinaryApiSecret}`
    
    console.log('Signature string for deletion:', signatureString)
    
    // Generate SHA1 signature
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureString)
    const hashBuffer = await crypto.crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('Generated signature:', signature)
    console.log('Timestamp:', timestamp)
    console.log('Public IDs to delete:', publicIds)

    // Create form data for Cloudinary deletion
    const formData = new FormData()
    formData.append('public_ids', publicIdsString)
    formData.append('api_key', cloudinaryApiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)

    console.log('Deleting from Cloudinary with signed request...')

    // Delete from Cloudinary using signed deletion
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text()
      console.error('Cloudinary deletion failed:', errorText)
      return new Response(
        JSON.stringify({ error: `Cloudinary deletion failed: ${cloudinaryResponse.status} - ${errorText}` }),
        { 
          status: cloudinaryResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const cloudinaryData = await cloudinaryResponse.json()
    console.log('Cloudinary deletion result:', cloudinaryData)
    
    return new Response(
      JSON.stringify(cloudinaryData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-from-cloudinary function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
