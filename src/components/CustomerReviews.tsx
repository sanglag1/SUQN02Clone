import React from "react";
import KineticTestimonial from "@/components/ui/kinetic-testimonials";

const testimonials = [
    {
        name: "Ava Thompson",
        handle: "@ava_thompson",
        review:
          "F.AI Interview is a game-changer! The mock interview sessions feel real and the AI feedback is super helpful.",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Elijah Carter",
        handle: "@elijah_ui",
        review:
          "Absolutely amazing! The AI asks tough but relevant questions, and it really boosted my confidence.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Sophia Martinez",
        handle: "@sophia_codes",
        review:
          "As a developer, I love how realistic the interview flow is. It feels like practicing with a real recruiter!",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Michael Brown",
        handle: "@michaelb_dev",
        review:
          "This changed how I prepare for job interviews. The feedback is detailed and easy to apply.",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Liam Anderson",
        handle: "@liamdesigns",
        review:
          "The best interview prep tool I’ve ever used! Straightforward, effective, and motivating.",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Olivia Hayes",
        handle: "@olivia_h",
        review:
          "Mind-blowing! AI-powered mock interviews are the future, and F.AI Interview is ahead of the game.",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Daniel Lee",
        handle: "@daniel_dev",
        review:
          "Brilliant execution! The platform makes practicing interviews effortless and professional.",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Sarah Green",
        handle: "@sarahgreen",
        review:
          "I can’t stop recommending this! It helped me land my first job after graduation.",
        avatar:
          "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Mia Patel",
        handle: "@miapatel",
        review:
          "F.AI Interview took my preparation to the next level. Highly recommend it to all job seekers!",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "James Walker",
        handle: "@jameswalker",
        review:
          "This feels like the future of interview coaching. I can’t believe such a powerful tool is free to try.",
        avatar:
          "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Emma Johnson",
        handle: "@emma_uiux",
        review:
          "Phenomenal! Every feature is designed to give you confidence and improve your answers.",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Ethan Roberts",
        handle: "@ethan_rob",
        review:
          "This platform completely changed my job hunt strategy. Practicing daily gave me a huge edge.",
        avatar:
          "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Isabella Davis",
        handle: "@bella_designs",
        review:
          "The realistic AI questions and structured feedback make it an essential tool for modern job seekers.",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Noah Wilson",
        handle: "@noah_dev",
        review:
          "Performance is fantastic! I get instant feedback, and my answers feel sharper every session.",
        avatar:
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Charlotte Moore",
        handle: "@charlotte_ui",
        review:
          "The learning curve is minimal, but the impact is massive. Exactly what I needed before interviews.",
        avatar:
          "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Lucas Taylor",
        handle: "@lucas_codes",
        review:
          "Revolutionary approach to interview prep. The AI suggestions are spot-on every time.",
        avatar:
          "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Amelia Clark",
        handle: "@amelia_design",
        review:
          "Since I started using F.AI Interview, my confidence in real interviews has skyrocketed.",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      {
        name: "Benjamin Lewis",
        handle: "@ben_frontend",
        review:
          "The range of questions and personalized feedback are incredible. It feels like having a personal coach.",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.0.3",
      },
      
];

export default function KineticTestimonialDemo() {
  return (
    <KineticTestimonial
      testimonials={testimonials}
      className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-black dark:to-black md:py-0 py-0 not-prose"
      cardClassName="hover:scale-105 shadow-lg"
      avatarClassName="ring-2 ring-purple-500"
      desktopColumns={3}
      tabletColumns={3}
      mobileColumns={2}
      speed={1.5}
      title="Customer Reviews"
      subtitle="What our users think about our product"
    />
  );
}
