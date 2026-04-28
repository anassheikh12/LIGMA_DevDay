const USE_MOCK_API = true;

export type User = {
  userId: string;
  name: string;
  email: string;
};

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 600));
    if (email.includes("exists")) {
      throw new Error("Email already registered");
    }
    return {
      userId: "mock-" + Math.random().toString(36).slice(2, 8),
      name,
      email,
    };
  }

  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error("Signup failed. Please try again.");
  return res.json();
}

export async function login(email: string, password: string): Promise<User> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 600));
    if (email.includes("fail")) {
      throw new Error("Invalid email or password");
    }
    return {
      userId: "mock-" + Math.random().toString(36).slice(2, 8),
      name: "Mock User",
      email,
    };
  }

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401) throw new Error("Invalid email or password");
  if (!res.ok) throw new Error("Login failed. Please try again.");
  return res.json();
}

export async function logout(): Promise<void> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 200));
    return;
  }
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<User | null> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 200));
    return { userId: 'test', name: 'Hamza', email: 'h@test.com' }; // simulate not logged in
  }

  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.authenticated ? data.user : null;
}
