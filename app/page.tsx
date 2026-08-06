"use client";
import Button from "./components/ui/button";
import { Highlighter } from "./components/ui/text-highlight";
import Image from "next/image";
import underline from "@/public/underline.png";
import { useRouter } from "next/navigation";
import { BentoGrid, BentoGridItem } from "./components/blocks/bento-grid";
import { TbSwords } from "react-icons/tb";
import { BiSolidMessageSquareDetail } from "react-icons/bi";
import ai from "@/public/ai.jpg";
import roast from "@/public/roast.jpg";
import versus from "@/public/versus.jpg";
import { BsFire } from "react-icons/bs";
import { FaTrophy } from "react-icons/fa";
import { Globe } from "./components/blocks/globe";
import {useSession} from "next-auth/react"; 
export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  console.log("Session data:", session);
  const features = [
    {
      title: "Live 1v1 debates",
      description:
        "Get matched with a real opponent and argue your case in real time. No scripts, no do-overs.",
      icon: (
        <TbSwords className="size-8 text-accent p-2 rounded-lg bg-accent/10" />
      ),
      header: (
        <Image
          src={versus}
          alt="AI judging a debate"
          className="rounded-lg object-cover w-full h-36"
        />
      ),
      className:
        "md:col-span-2 bg-muted/50 backdrop-blur-lg  border border-primary/20 h-full",
    },
    {
      title: "AI-judged, every round",
      description:
        "Debatrix scores logic, evidence, and persuasion as the debate happens — then delivers a verdict.",
      icon: (
        <BiSolidMessageSquareDetail className="size-8 text-accent p-2 rounded-lg bg-accent/10" />
      ),
      header: (
        <Image
          src={ai}
          alt="AI judging a debate"
          className="rounded-lg object-cover w-full h-36"
        />
      ),
      className:
        "md:col-span-1 bg-muted/50 backdrop-blur-lg  border border-primary/20 h-full",
    },
    {
      title: "Ranked ELO ladder",
      description:
        "Win, gain ELO. Lose, learn exactly where your argument broke down. Climb like it's ranked play.",
      icon: (
        <FaTrophy className="size-8 text-accent p-2 rounded-lg bg-accent/10" />
      ),
      className:
        "md:col-span-2 bg-muted/50 backdrop-blur-lg  border border-primary/20 h-full",
      header: (
        <div className="relative w-full h-36 rounded-lg overflow-hidden">
          <Globe className="-top-10" />
        </div>
      ),
    },
    {
      title: "Solo roast mode",
      description:
        "Not ready to go live? Submit an argument on its own and get roasted, scored, and sharpened first.",
      icon: (
        <BsFire className="size-8 text-accent p-2 rounded-lg bg-accent/10" />
      ),
      className:
        "md:col-span-1 bg-muted/50 backdrop-blur-lg  border border-primary/20 h-full",
      header: (
        <Image
          src={roast}
          alt="AI roasting a debate"
          className="rounded-lg object-cover w-full h-36"
        />
      ),
    },
  ];
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 pt-40 w-full">
      <div className="flex flex-col gap-6 max-w-3xl  justify-center items-center text-center">
        <h1 className="text-5xl font-semibold font-montserrat text-accent">
          Prove You've Got The Sharper Argument On{" "}
          <span className="text-[#1575dc] relative font-fascinate-inline">
            Debatrix{" "}
            <Image
              src={underline}
              alt="Underline"
              className="absolute -bottom-1 left-8 w-48 object-contain"
            />
          </span>
        </h1>
        <span className="text-sm text-secondary font-poppins font-medium text-center max-w-xl mt-4">
          Get matched with{" "}
          <Highlighter action="highlight" color="#1591DC">
            real opponent
          </Highlighter>{" "}
          . Debatrix's AI judges every exchange and crowns a winner. No more I
          would've destroyed them after the fact.
        </span>
        <div className="flex gap-5 justify-center mt-4">
          <Button
            variant="secondary"
            className="rounded-lg "
            onClick={() => router.push("/discover")}
          >
            Join a Debate
          </Button>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => router.push("/roast")}
          >
            Get Roasted
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-12 gap-4">
        <h2 className="relative text-2xl font-extrabold font-montserrat text-accent">
          Our Features
          <Image
            src={underline}
            alt="Underline"
            className="absolute -bottom-1.5 left-8 w-28 object-contain"
          />
        </h2>
        <p className="text-secondary text-sm font-medium font-poppins text-center max-w-md">
          Discover the features that make Debatrix the ultimate platform for intellectual combat.
        </p>
        <BentoGrid className="max-w-4xl mx-auto md:auto-rows-80 mt-10">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={item.className}
              icon={item.icon}
            />
          ))}
        </BentoGrid>
      </div>
    </main>
  );
}
