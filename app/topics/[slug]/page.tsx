import { notFound } from "next/navigation";
import { QALayout } from "@/components/qa/qa-layout";
import { QuestionCard } from "@/components/qa/question-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

async function getTopicData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/topics/${slug}`, {
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch topic: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Failed to fetch topic:", error);
    return null;
  }
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topicData = await getTopicData(params.slug);

  if (!topicData) {
    notFound();
  }

  const { topic, questions } = topicData;

  return (
    <QALayout>
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Link>
          </Button>
        </div>

        {/* Topic Header */}
        <section className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="text-lg px-4 py-1">
              {topic.name}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Questions about {topic.name}
          </h1>

          {topic.description && (
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {topic.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>{topic.questionCount} {topic.questionCount === 1 ? "Question" : "Questions"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {questions.length} {questions.length === 1 ? "Question" : "Questions"}
            </h2>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to ask a question about {topic.name}!
              </p>
              <Button asChild>
                <Link href="/ask">
                  Ask the First Question
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question: any) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </section>
      </div>
    </QALayout>
  );
}