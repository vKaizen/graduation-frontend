import LoginForm from "./login-form"
import { BackgroundLines } from "@/components/ui/background-lines"

export default function LoginPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#1a1a1a] p-4">
      <BackgroundLines />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
