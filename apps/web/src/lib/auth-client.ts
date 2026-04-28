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
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();

  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error(data.error || "Signup failed. Please try again.");
  return data;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.status === 401) throw new Error("Invalid email or password");
  if (!res.ok) throw new Error(data.error || "Login failed. Please try again.");
  return data;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<User | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.authenticated ? data.user : null;
}
