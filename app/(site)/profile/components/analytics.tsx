import React from "react";

interface AnalyticsSectionProps {
  overallScore: number;
  logicScore: number;
  persuasionScore: number;
  factCheckAccuracy: number;
  aiFeedbackSummary: string;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  overallScore,
  logicScore,
  persuasionScore,
  factCheckAccuracy,
  aiFeedbackSummary,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-poppins">
      <div className="rounded-2xl bg-muted/40 backdrop-blur-lg border border-primary/20 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-accent">AI Aspect Score</h3>
          <p className="text-xs text-secondary mt-0.5 font-medium">
            Automated argument analysis
          </p>
        </div>
        <div className="my-6 flex items-center justify-center">
          <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-8 border-primary/20 border-t-secondary">
            <span className="text-3xl font-extrabold text-foreground">
              {overallScore}
            </span>
            <span className="absolute bottom-4 text-[10px] uppercase font-bold text-secondary">
              Rating
            </span>
          </div>
        </div>
        <div className="text-center text-xs text-secondary">
          Based on reasoning, structure & clarity
        </div>
      </div>

      <div className="rounded-2xl bg-muted/40 backdrop-blur-lg border border-primary/20 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-accent">AI Coach Feedback</h3>
          </div>
          <p className="text-xs text-secondary mt-3 leading-relaxed bg-muted p-3 rounded-xl border border-primary/20">
            &ldquo;{aiFeedbackSummary}&rdquo;
          </p>
        </div>
        <div className="space-y-2 mt-4 pt-3 border-t border-primary/80 text-xs">
          <div className="flex justify-between text-secondary">
            <span>Fact-Check Accuracy</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {factCheckAccuracy}%
            </span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>Logical Fallacy Rate</span>
            <span className="text-primary font-semibold">Low (1.2/room)</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-muted/50 backdrop-blur-lg border border-primary/20 p-5 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-accent">
          Style & Persuasion
        </h3>
        <div className="space-y-4 my-auto py-4">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-secondary">Logical Rigor</span>
              <span className="text-indigo-400">{logicScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-primary overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${logicScore}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-secondary">Emotional Persuasion</span>
              <span className="text-primary">{persuasionScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-primary overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${persuasionScore}%` }}
              />
            </div>
          </div>
        </div>
        <div className="text-xs text-secondary text-center">
          Updated automatically after live debate rooms
        </div>
      </div>
    </div>
  );
};
