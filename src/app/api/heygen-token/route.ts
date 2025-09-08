const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.heygen.com';

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      console.error("HEYGEN_API_KEY is missing from environment variables");
      return new Response("API key configuration error", { status: 500 });
    }

    const response = await fetch(`${HEYGEN_BASE_URL}/v1/streaming.create_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": HEYGEN_API_KEY,
      },
    });

    if (!response.ok) {
      console.error("HeyGen API error:", response.status, response.statusText);
      return new Response("Failed to get token from HeyGen API", { status: response.status });
    }

    const data = await response.json();
    if (!data?.data?.token) {
      console.error("Invalid token response:", data);
      return new Response("Invalid token response from HeyGen API", { status: 500 });
    }

    // Return the raw token as text
    return new Response(data.data.token, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Error retrieving access token:", error);
    return new Response("Failed to retrieve access token", { status: 500 });
  }
}
