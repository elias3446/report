
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
    const { fileData, fileName, fileType, folder } = await req.json()

    if (!fileData || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing file data or file name' }),
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

    // Generate timestamp for signed upload (in seconds, not milliseconds)
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // Create signature for signed upload
    const crypto = await import("https://deno.land/std@0.177.0/crypto/mod.ts")
    
    // Create signature string including folder if provided
    let signatureString = `timestamp=${timestamp}`
    
    if (folder) {
      signatureString = `folder=${folder}&timestamp=${timestamp}`
    }
    
    signatureString += cloudinaryApiSecret
    
    console.log('Signature string:', signatureString)
    
    // Generate SHA1 signature
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureString)
    const hashBuffer = await crypto.crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('Generated signature:', signature)
    console.log('Timestamp:', timestamp)
    if (folder) console.log('Folder:', folder)

    // Create form data for Cloudinary upload
    const formData = new FormData()
    
    // Convert base64 back to file
    const binaryString = atob(fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: fileType })
    
    formData.append('file', blob, fileName)
    formData.append('api_key', cloudinaryApiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    
    // Add folder if provided
    if (folder) {
      formData.append('folder', folder)
    }

    console.log('Uploading to Cloudinary with signed request...')
    console.log('Cloud name:', cloudinaryCloudName)
    console.log('API key:', cloudinaryApiKey)

    // Upload to Cloudinary using signed upload
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text()
      console.error('Cloudinary upload failed:', errorText)
      return new Response(
        JSON.stringify({ error: `Cloudinary upload failed: ${cloudinaryResponse.status} - ${errorText}` }),
        { 
          status: cloudinaryResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const cloudinaryData = await cloudinaryResponse.json()
    console.log('Cloudinary upload successful:', cloudinaryData.secure_url)
    
    return new Response(
      JSON.stringify(cloudinaryData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in upload-to-cloudinary function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
