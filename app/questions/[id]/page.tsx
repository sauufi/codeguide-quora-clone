"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { QALayout } from "@/components/qa/qa-layout";
import { QuestionCard } from "@/components/qa/question-card";
import { AnswerCard } from "@/components/qa/answer-card";
import { AnswerForm } from "@/components/qa/answer-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  upvotes: number;
  downvotes: number;
  answerCount: number;
  topics: string[];
  userVote?: "upvote" | "downvote" | null;
  answers: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    authorId: string;
    createdAt: string;
    updatedAt: string;
    voteCount: number;
    upvotes: number;
    downvotes: number;
    userVote?: "upvote" | "downvote" | null;
  }>;
}

export default function QuestionPage() {
  const params = useParams();
  const { data: session, isPending } = useSession();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(`/api/questions/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error(`Failed to fetch question: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
          setQuestion(result.data);
        } else {
          setError(result.error || "Failed to load question");
        }
      } catch (error) {
        console.error("Failed to fetch question:", error);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchQuestion();
    }
  }, [params.id]);

  if (loading) {
    return (
      <QALayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
          </div>

          <Skeleton className="h-32 w-full" />

          <Separator />

          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </QALayout>
    );
  }

  if (error || !question) {
    return (
      <QALayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="text-4xl">❌</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Error</h3>
                  <p className="text-muted-foreground">
                    {error || "Question not found"}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/">Back to Questions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </QALayout>
    );
  }

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

        {/* Question */}
        <section>
          <QuestionCard question={question} showContent={true} />
        </section>

        <Separator />

        {/* Answers Section */}
        <section id="answers">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                {question.answers.length} {question.answers.length === 1 ? "Answer" : "Answers"}
              </h2>
            </div>
          </div>

          {question.answers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="text-4xl">💭</div>
                  <div>
                    <h3 className="text-lg font-semibold">No answers yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Be the first to share what you know!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {question.answers.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} />
              ))}
            </div>
          )}
        </section>

        {/* Answer Form */}
        {session && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <AnswerForm questionId={question.id} />
              </CardContent>
            </Card>
          </section>
        )}

        {!session && !isPending && (
          <section>
            <Card>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Sign in to share your knowledge and help answer this question.
                  </p>
                  <Button asChild>
                    <Link href="/sign-in">Sign In to Answer</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </QALayout>
  );
}