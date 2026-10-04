"use client";
import { useEffect, useState } from "react";
import { Dumbbell, Play, Pause } from "lucide-react";
import { Exercise } from "@/types";
import { safeMediaUrl } from "@/lib/exercises/catalog";

export default function ExerciseMedia({
  exercise,
  size = "thumbnail",
  eager = false,
}: {
  exercise: Exercise;
  size?: "thumbnail" | "card" | "demo";
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false),
    [animationFailed, setAnimationFailed] = useState(false),
    [playing, setPlaying] = useState(false),
    [reduced, setReduced] = useState(true),
    [offline, setOffline] = useState(false);
  const image = safeMediaUrl(exercise.imageUrl),
    animation = safeMediaUrl(exercise.animationUrl);
  useEffect(() => {
    setFailed(false);
    setAnimationFailed(false);
    setPlaying(false);
  }, [image, animation]);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => {
      setReduced(query.matches);
      if (query.matches) setPlaying(false);
    };
    const connection = () => setOffline(!navigator.onLine);
    motion();
    connection();
    query.addEventListener("change", motion);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      query.removeEventListener("change", motion);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, []);
  const available = (url?: string) =>
    url &&
    !(
      offline &&
      !url.startsWith("/") &&
      new URL(url).origin !== location.origin
    );
  const animate =
    size === "demo" && !reduced && !animationFailed && available(animation);
  const video = animation && /\.(mp4|webm)(\?|$)/i.test(animation);
  return (
    <div
      className={`exercise-media media-${size}`}
      data-media-state={failed || !available(image) ? "fallback" : "image"}
    >
      {playing && animate ? (
        video ? (
          <video
            src={animation}
            controls
            autoPlay
            playsInline
            muted
            preload="none"
            poster={image}
            aria-label={`${exercise.name} demonstration`}
            onError={() => {
              setAnimationFailed(true);
              setPlaying(false);
            }}
          />
        ) : (
          <img
            src={animation}
            alt={`${exercise.name} movement demonstration`}
            onError={() => {
              setAnimationFailed(true);
              setPlaying(false);
            }}
          />
        )
      ) : available(image) && !failed ? (
        <img
          src={image}
          alt={`${exercise.name} — start and finish positions`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={480}
          height={270}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="media-placeholder"
          role="img"
          aria-label={`${exercise.name}: illustration unavailable`}
        >
          <Dumbbell strokeWidth={1.4} />
          {size !== "thumbnail" && (
            <>
              <strong>{exercise.name}</strong>
              <span>Illustration unavailable</span>
            </>
          )}
        </div>
      )}
      {animate && (
        <button className="media-play" onClick={() => setPlaying(!playing)}>
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Stop animation" : "Play demonstration"}
        </button>
      )}
    </div>
  );
}
