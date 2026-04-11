import { Play, Wifi } from "lucide-react";

export default function VideoStage() {
  return (
    <section className="p-7">
      <div className="grid h-[72vh] place-items-center rounded-[22px] bg-[#07153a]/80">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/10">
            <Play size={34} className="text-white/60" />
          </div>
          <p className="mt-6 text-2xl text-white/45 md:text-base">
            Upload or select a video to start watching
          </p>
        </div>
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-lg text-emerald-400 md:text-sm">
        <Wifi size={16} /> Connected • Real-time sync active
      </p>
    </section>
  );
}