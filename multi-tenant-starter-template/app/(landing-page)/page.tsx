import {
  CallToAction,
  Hero,
  Journey,
  Modules,
  Roles,
  Security,
  Stats,
} from "@/components/landing/sections";

export default function IndexPage() {
  return (
    <>
      <Hero />
      <Stats />
      <Modules />
      <Journey />
      <Roles />
      <Security />
      <CallToAction />
    </>
  );
}
