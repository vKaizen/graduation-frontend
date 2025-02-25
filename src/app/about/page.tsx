import TaskLayout from "@/components/task-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, Linkedin, Mail } from "lucide-react"

export default function AboutPage() {
  return (
    <TaskLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">About the Developer</h1>

        <Card className="bg-[#2f2d45] border-0 mb-8 text-white">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WUXcKQSumnMERmyMj9qQSP48QcRvJY.png"
                  alt="Developer"
                />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">John Doe</CardTitle>
                <p className="text-gray-300">Full Stack Developer</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Hi there! Im John Doe, a passionate full stack developer with over 5 years of experience in creating
              robust and scalable web applications. My journey in tech started with a curiosity about how things work on
              the internet, and it has led me to become proficient in a wide range of technologies.
            </p>
            <p className="mb-4">
              I specialize in JavaScript ecosystems, particularly React and Node.js. Im also experienced with
              TypeScript, Next.js, and various database technologies. My approach to development is centered around
              creating clean, maintainable code and delivering exceptional user experiences.
            </p>
            <p className="mb-4">
              When Im not coding, you can find me exploring new tech trends, contributing to open-source projects, or
              enjoying a good cup of coffee while solving algorithm challenges.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://github.com/johndoe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://linkedin.com/in/johndoe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="mailto:john.doe@example.com" className="text-gray-300 hover:text-white">
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2f2d45] border-0 text-white">
          <CardHeader>
            <CardTitle>Skills & Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>JavaScript / TypeScript</li>
              <li>React.js / Next.js</li>
              <li>Node.js / Express.js</li>
              <li>MongoDB / PostgreSQL</li>
              <li>GraphQL / REST APIs</li>
              <li>Docker / Kubernetes</li>
              <li>AWS / Google Cloud Platform</li>
              <li>CI/CD (Jenkins, GitHub Actions)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </TaskLayout>
  )
}

