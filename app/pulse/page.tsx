import getPulses from "@/actions/getPulses";
import PulseClient from "@/app/pulse/components/PulseClient";

export const revalidate = 0;

export default async function PulsePage() {
  const pulses = await getPulses();

  return <PulseClient pulses={pulses} />;
}
