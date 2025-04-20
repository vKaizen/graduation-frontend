import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#272638] to-[#1a1726] text-white">
      <header className="container mx-auto px-4 py-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-[#0B5269]"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z" />
          </svg>
          <span className="text-2xl font-bold">Avana</span>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="#features" className="hover:text-[#0B5269]">
                Features
              </Link>
            </li>
            <li>
              <Link href="#pricing" className="hover:text-[#0B5269]">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="#about" className="hover:text-[#0B5269]">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Supercharge Your Workspace Productivity with AI
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Avana is the all-in-one AI-powered platform that helps organizations
            collaborate, manage projects, and boost productivity like never
            before.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-[#0B5269] hover:bg-[#0B5269]/90">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Task Management",
                description:
                  "Let our AI organize and prioritize your tasks for maximum efficiency.",
                icon: <Zap className="h-12 w-12 text-[#0B5269]" />,
              },
              {
                title: "Smart Collaboration",
                description:
                  "Real-time collaboration with AI-suggested collaborators for each task.",
                icon: <CheckCircle className="h-12 w-12 text-[#0B5269]" />,
              },
              {
                title: "Predictive Analytics",
                description:
                  "Forecast project timelines and resource needs with our advanced AI.",
                icon: <ArrowRight className="h-12 w-12 text-[#0B5269]" />,
              },
            ].map((feature, index) => (
              <Card key={index} className="bg-[#2f2d45] border-0">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Starter",
                price: "$9",
                description: "Perfect for individuals and small workspaces",
                features: [
                  "AI Task Management",
                  "Basic Collaboration",
                  "5 Members",
                ],
              },
              {
                title: "Pro",
                price: "$29",
                description: "Ideal for growing businesses",
                features: [
                  "Everything in Starter",
                  "Smart Collaboration",
                  "Predictive Analytics",
                  "25 Members",
                ],
              },
              {
                title: "Enterprise",
                price: "Custom",
                description: "For large organizations",
                features: [
                  "Everything in Pro",
                  "Dedicated Support",
                  "Custom Integrations",
                  "Unlimited Members",
                ],
              },
            ].map((plan, index) => (
              <Card key={index} className="bg-[#2f2d45] border-0">
                <CardHeader>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span className="text-gray-400">/month</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{plan.description}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#0B5269] mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-[#2f2d45] py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl mb-8 text-center max-w-2xl mx-auto">
              Join thousands of organizations already using Avana to supercharge
              their productivity.
            </p>
            <form className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
              <Input
                type="email"
                placeholder="Enter your email"
                className="max-w-sm bg-[#272638] border-0 text-white"
              />
              <Button size="lg" className="bg-[#0B5269] hover:bg-[#0B5269]/90">
                Start Free Trial
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#1a1726] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Zap className="h-6 w-6 text-[#0B5269]" />
              <span className="text-xl font-bold">Avana</span>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="#" className="hover:text-[#0B5269]">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#0B5269]">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#0B5269]">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="mt-8 text-center text-gray-400">
            © 2025 Avana. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
