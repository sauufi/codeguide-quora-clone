import { QuestionsFeed } from "@/components/qa/questions-feed";
import { QALayout } from "@/components/qa/qa-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function QuestionsPage() {
  return (
    <QALayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Questions</h1>
            <p className="text-muted-foreground mt-2">
              Browse questions from our community or ask your own.
            </p>
          </div>

          <Button asChild>
            <Link href="/ask">
              <Plus className="mr-2 h-4 w-4" />
              Ask Question
            </Link>
          </Button>
        </div>

        <QuestionsFeed />
      </div>
    </QALayout>
  );
}