import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the path after /api/proxy
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    // Construct the backend URL
    const backendUrl = process.env.BACKEND_URL || 'https://khanzadiasfi0314-todoapp-chatbot.hf.space';
    const targetUrl = `${backendUrl}/${path}`;

    // Get auth token if exists
    const authToken = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': authToken }),
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    const backendUrl = process.env.BACKEND_URL || 'https://khanzadiasfi0314-todoapp-chatbot.hf.space';
    const targetUrl = `${backendUrl}/${path}`;

    const body = await request.json();
    const authToken = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': authToken }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    const backendUrl = process.env.BACKEND_URL || 'https://khanzadiasfi0314-todoapp-chatbot.hf.space';
    const targetUrl = `${backendUrl}/${path}`;

    const body = await request.json();
    const authToken = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': authToken }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    const backendUrl = process.env.BACKEND_URL || 'https://khanzadiasfi0314-todoapp-chatbot.hf.space';
    const targetUrl = `${backendUrl}/${path}`;

    const authToken = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': authToken }),
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}