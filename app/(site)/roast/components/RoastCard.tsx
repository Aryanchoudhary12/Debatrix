import { LuBrain } from "react-icons/lu";
import { SiFireship } from "react-icons/si";

interface RoastAnalytics {
  roastLevel: number;
  logicCheck: string;
  burnScore: number;
}

interface ResponseCardProps {
  roastText: string;
  analytics: RoastAnalytics;
}
export const RoastResponseCard: React.FC<ResponseCardProps> = ({
  roastText,
  analytics,
}) => {
  return (
    <div className="flex w-full justify-start mb-6">
      <div className=" bg-muted/80  backdrop-blur-xl border border-primary/20 rounded-2xl rounded-tl-sm p-5">
        <p className="font-poppins text-accent text-sm leading-relaxed mb-5">
          {roastText}
        </p>

        <div className="bg-secondary rounded-xl p-4 border border-primary/30">
          <h4 className="font-montserrat text-sm font-black text-background mb-3 tracking-wider flex items-center gap-2">
            Roast Analytics
          </h4>

          <div className="space-y-1">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-poppins font-semibold text-muted">
                  Roast level
                </span>
                <span className="font-poppins text-muted font-medium">
                  {analytics.roastLevel}% (Severe Burn)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${analytics.roastLevel}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2 px-4 bg-primary rounded-xl flex gap-3 md:gap-2 md:flex-col">
                <LuBrain className="size-8.5 p-2 bg-sky-200/20 text-sky-100 rounded-3xl" />
                <p className="font-poppins text-sky-200 text-xs font-medium flex flex-col md:items-end">
                  Logic Check <br />
                  <span className="font-poppins text-white text-sm font-bold">
                    {analytics.logicCheck}
                  </span>
                </p>
              </div>

              <div className="p-2 px-4 bg-primary rounded-xl flex gap-3 md:gap-0 md:flex-col">
                <SiFireship className="size-8.5 p-2 bg-sky-200/20 text-sky-100 rounded-3xl" />
                <p className="font-poppins text-sky-200 text-xs font-medium flex flex-col md:items-end">
                  Burn Score
                  <span className="font-poppins text-white text-sm font-bold">
                    {analytics.burnScore}/100
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
