"use client";

import { QALayout } from "@/components/qa/qa-layout";
import { QuestionForm } from "@/components/qa/question-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export default function AskPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <QALayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-64"></div>
            <div className="h-4 bg-muted rounded mb-8 w-96"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </QALayout>
    );
  }

  if (!session) {
    return (
      <QALayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
                  <p className="text-muted-foreground">
                    You need to be signed in to ask a question on our platform.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/">Back to Home</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </QALayout>
    );
  }

  return (
    <QALayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Ask a Question</h1>
          <p className="text-muted-foreground">
            Share your question with our community and get helpful answers.
          </p>
        </div>

        <QuestionForm />
      </div>
    </QALayout>
  );
}