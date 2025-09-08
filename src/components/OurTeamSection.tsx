"use client";

import ProfileCard from '@/components/ui/profilecard';

const TEAM = [
  {
    img: '/phuc.jpg',
    name: 'Huu Phuc',
    position: 'Founder & CEO',
    bio: 'Building F.AI Interview to help candidates practice effectively with AI.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'React', iconUrl: '/next.svg' },
      { name: 'Node', iconUrl: '/next.svg' },
      { name: 'AI', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/phuc.jpg',
    name: 'Dai Viet',
    position: 'Head of AI',
    bio: 'Researching LLM prompts, evaluation and content generation.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Python', iconUrl: '/next.svg' },
      { name: 'Azure OpenAI', iconUrl: '/next.svg' },
      { name: 'RAG', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/phuc.jpg',
    name: 'Xuan Sang',
    position: 'Product Lead',
    bio: 'Turning user feedback into delightful features and experiences.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Product', iconUrl: '/next.svg' },
      { name: 'UX', iconUrl: '/next.svg' },
      { name: 'Analytics', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/phuc.jpg',
    name: 'Minh Hung',
    position: 'Design Lead',
    bio: 'Designing clean, accessible interfaces for better learning outcomes.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Figma', iconUrl: '/next.svg' },
      { name: 'Motion', iconUrl: '/next.svg' },
      { name: 'UI Systems', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/phuc.jpg',
    name: 'Thu Van',
    position: 'Backend Lead',
    bio: 'Building the backend infrastructure for F.AI Interview.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Figma', iconUrl: '/next.svg' },
      { name: 'Motion', iconUrl: '/next.svg' },
      { name: 'UI Systems', iconUrl: '/next.svg' },
    ],
  },
];

export default function OurTeamSection() {
  return (
    <section id="ourteams" className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_80%_0%,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 md:py-24 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Team</h2>
          <p className="mt-3 text-gray-600">People behind F.AI Interview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {TEAM.map((m) => (
            <ProfileCard
              key={m.name}
              img={m.img}
              name={m.name}
              bio={m.bio}
              skills={m.skills}
              githubUrl={m.githubUrl}
              twitterUrl={m.twitterUrl}
              position={m.position}
            />
          ))}
        </div>
      </div>
    </section>
  );
}



