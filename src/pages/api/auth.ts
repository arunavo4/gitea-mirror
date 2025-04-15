import type { APIRoute } from 'astro';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const POST: APIRoute = async ({ request }) => {
  const { pathname } = new URL(request.url);
  const endpoint = pathname.split('/').pop();

  try {
    if (endpoint === 'login') {
      return await handleLogin(request);
    } else if (endpoint === 'register') {
      return await handleRegister(request);
    } else if (endpoint === 'logout') {
      return await handleLogout();
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const GET: APIRoute = async ({ request, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1] || cookies.get('token')?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);

    if (!user.length) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { password, ...userWithoutPassword } = user[0];

    return new Response(JSON.stringify(userWithoutPassword), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handleLogin(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user.length) {
    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user[0].password);

  if (!isPasswordValid) {
    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { password: _, ...userWithoutPassword } = user[0];
  const token = jwt.sign({ id: user[0].id }, JWT_SECRET, { expiresIn: '7d' });

  return new Response(JSON.stringify({ token, user: userWithoutPassword }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`,
    },
  });
}

async function handleRegister(request: Request) {
  const { username, email, password } = await request.json();

  if (!username || !email || !password) {
    return new Response(JSON.stringify({ error: 'Username, email, and password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if username or email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .or(eq(users.email, email))
    .limit(1);

  if (existingUser.length) {
    return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate UUID
  const id = crypto.randomUUID();

  // Create user
  const newUser = await db.insert(users).values({
    id,
    username,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  const { password: _, ...userWithoutPassword } = newUser[0];
  const token = jwt.sign({ id: newUser[0].id }, JWT_SECRET, { expiresIn: '7d' });

  return new Response(JSON.stringify({ token, user: userWithoutPassword }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`,
    },
  });
}

async function handleLogout() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    },
  });
}
