"use client";
import { TbDeviceTvOldFilled } from "react-icons/tb";
import { RiRobot3Fill } from "react-icons/ri";

export interface DebateMetrics {
  overallScore: number;
  logicScore: number;
  persuasionScore: number;
  factCheckAccuracy: number;
}

export interface AIAnalyticsDashboardProps {
  debater1Name: string;
  debater2Name: string;
  debater1Metrics: DebateMetrics;
  debater2Metrics: DebateMetrics;
}

interface MetricRowProps {
  label: string;
  score1: number;
  score2: number;
  debater1Name: string;
  debater2Name: string;
  isOverall?: boolean;
}

function MetricRow({ label, score1, score2, debater1Name, debater2Name, isOverall = false }: MetricRowProps) {
  const is1Winning = score1 > score2;
  const isTie = score1 === score2;

  return (
    <div className={`p-4 rounded-lg bg-muted/50 font-poppins backdrop-blur-lg border ${isOverall ? "border-primary/40 bg-primary/5" : "border-primary/10"}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold ${isOverall ? "text-base text-accent uppercase tracking-wider font-bold" : "text-sm text-secondary"}`}>
          {label}
        </span>
        <span className="text-[11px] text-secondary/70 font-mono">Metric out of 100</span>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={`truncate font-medium ${is1Winning ? "text-accent font-bold" : "text-secondary"}`}>
              {debater1Name}
            </span>
            <span className={`font-mono font-bold ${is1Winning ? "text-primary" : "text-secondary"}`}>
              {score1}/100
            </span>
          </div>
          <div className="w-full bg-muted-foreground/20 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${is1Winning || isTie ? "bg-primary" : "bg-primary/40"}`}
              style={{ width: `${score1}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={`truncate font-medium ${!is1Winning && !isTie ? "text-accent font-bold" : "text-secondary"}`}>
              {debater2Name}
            </span>
            <span className={`font-mono font-bold ${!is1Winning && !isTie ? "text-primary" : "text-secondary"}`}>
              {score2}/100
            </span>
          </div>
          <div className="w-full bg-muted-foreground/20 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${!is1Winning || isTie ? "bg-primary" : "bg-primary/40"}`}
              style={{ width: `${score2}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIAnalyticsDashboard({
  debater1Name,
  debater2Name,
  debater1Metrics,
  debater2Metrics,
}: AIAnalyticsDashboardProps) {
  return (
    <section className="w-full bg-muted/50 backdrop-blur-lg p-6 rounded-xl border border-primary/20">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <RiRobot3Fill className="size-8 text-primary" style={{ animationDuration: "8s" }} />
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              AI Live Debate Analytics
            </h2>
            <p className="text-xs text-secondary">
              Real-time semantic analysis, logical reasoning tracking, and rhetoric scoring
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold border border-primary/20">
          <TbDeviceTvOldFilled className="w-4 h-4" /> Live AI Engine Active
        </div>
      </div>

      <div className="space-y-3">
        <MetricRow
          label="Overall Debate Score"
          score1={parseFloat(debater1Metrics.overallScore.toFixed(3))}
          score2={parseFloat(debater2Metrics.overallScore.toFixed(3))}
          debater1Name={debater1Name}
          debater2Name={debater2Name}
          isOverall={true}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <MetricRow
            label="Logic & Coherence"
            score1={parseFloat(debater1Metrics.logicScore.toFixed(3))}
            score2={parseFloat(debater2Metrics.logicScore.toFixed(3))}
            debater1Name={debater1Name}
            debater2Name={debater2Name}
          />
          <MetricRow
            label="Rhetoric & Persuasion"
            score1={parseFloat(debater1Metrics.persuasionScore.toFixed(3))}
            score2={parseFloat(debater2Metrics.persuasionScore.toFixed(3))}
            debater1Name={debater1Name}
            debater2Name={debater2Name}
          />
          <MetricRow
            label="Fact-Check Accuracy"
            score1={parseFloat(debater1Metrics.factCheckAccuracy.toFixed(3))}
            score2={parseFloat(debater2Metrics.factCheckAccuracy.toFixed(3))}
            debater1Name={debater1Name}
            debater2Name={debater2Name}
          />
        </div>
      </div>
    </section>
  );
}