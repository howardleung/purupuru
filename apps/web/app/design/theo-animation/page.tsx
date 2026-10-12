import type { Metadata } from "next";

import { TheoAnimationPrototype } from "./theo-animation-prototype";

export const metadata: Metadata = {
  title: "Help Me Choose Prototype",
  description: "An isolated skincare consultation prototype with PuruPuru mascot Theo.",
};

export default function TheoAnimationPage() {
  return <TheoAnimationPrototype />;
}
