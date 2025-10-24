import { QuestionsFeed } from "@/components/qa/questions-feed";
import { QALayout } from "@/components/qa/qa-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

async function getInitialQuestions() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/questions?page=1&limit=10&sort=recent`, {
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch questions:", response.status, response.statusText);
      return [];
    }

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error("Failed to fetch initial questions:", error);
    return [];
  }
}

export default async function Home() {
  const initialQuestions = await getInitialQuestions();

  return (
    <QALayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <section className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Q&A Platform
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get answers to your questions from our community. Ask anything, share your knowledge, and help others learn.
          </p>

          <Button asChild size="lg">
            <Link href="/ask">
              <Plus className="mr-2 h-5 w-5" />
              Ask Your First Question
            </Link>
          </Button>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">5,678</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">9,012</div>
              <div className="text-sm text-muted-foreground">Answers</div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Categories */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Popular Topics</h2>
          <div className="flex flex-wrap gap-2">
            {["Technology", "Science", "Business", "Arts & Culture", "Health", "Education"].map((topic) => (
              <Badge key={topic} variant="secondary" className="text-sm">
                {topic}
              </Badge>
            ))}
          </div>
        </section>

        {/* Questions Feed */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Questions</h2>
            <Button variant="outline" asChild>
              <Link href="/questions">
                View All Questions
              </Link>
            </Button>
          </div>

          <QuestionsFeed initialQuestions={initialQuestions} />
        </section>
      </div>
    </QALayout>
  );
}