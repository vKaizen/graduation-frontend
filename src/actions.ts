"use server"

export async function loginUser(formData: { email: string; password: string }) {
  try {
    const response = await fetch("http://localhost:3000/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Invalid email or password" }
  }
}

export async function registerUser(formData: {
  fullName: string
  email: string
  jobTitle: string
  bio: string
  password: string
}) {
  try {
    const response = await fetch("http://localhost:3000/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error("Registration failed")
    }

    const data = await response.json()
    console.log(data)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Registration failed. Please try again." }
  }
}

