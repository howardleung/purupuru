"use client";

import { PROFILE_SKIN_TYPES, type ProfileSkinType } from "@beauty-platform/domain/profile";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateProfile } from "../app/profile/actions";
import {
  initialProfileActionState,
  type ProfileAvatarView,
  type ProfileFormValue,
} from "../lib/profile-contract";

const skinTypeLabels: Record<ProfileSkinType, string> = {
  NORMAL: "Normal",
  DRY: "Dry",
  OILY: "Oily",
  COMBINATION: "Combination",
};

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button className="ui-button ui-button--primary" disabled={pending} type="submit">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function ProfileForm({
  avatars,
  initialValue,
}: {
  avatars: ProfileAvatarView[];
  initialValue: ProfileFormValue;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialProfileActionState);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(initialValue.displayName);
  const [skinType, setSkinType] = useState<ProfileSkinType | null>(initialValue.skinType);
  const [sensitiveSkin, setSensitiveSkin] = useState(initialValue.sensitiveSkin);
  const [selectedAvatarId, setSelectedAvatarId] = useState(initialValue.selectedAvatarId);
  const selectedAvatar = avatars.find((avatar) => avatar.id === selectedAvatarId) ?? avatars[0];
  const skinSummary = [skinType ? `${skinTypeLabels[skinType]} skin` : "Skin type not set", sensitiveSkin ? "Sensitive" : null]
    .filter(Boolean).join(" · ");

  return (
    <section aria-labelledby="public-profile-title" className="surface-card overflow-hidden">
      <div className="brand-band flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
        {selectedAvatar ? (
          <Image alt={selectedAvatar.name} className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-soft" height={96} priority src={selectedAvatar.assetPath} width={96} />
        ) : null}
        <div>
          <p className="eyebrow">Public PuruPuru identity</p>
          <h2 className="mt-2 text-2xl font-extrabold text-brand-ink" id="public-profile-title">{displayName || "PuruPuru User"}</h2>
          <p className="mt-1 text-sm text-slate-600">{skinSummary}</p>
        </div>
      </div>

      <form
        className="grid gap-7 p-5 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const nextState = await updateProfile(state, formData);
            setState(nextState);
            if (nextState.status === "SUCCESS") router.refresh();
          });
        }}
      >
        <label className="grid max-w-xl gap-2 text-sm font-bold text-slate-800">
          Display name
          <input
            autoComplete="nickname"
            className="ui-input font-normal"
            maxLength={40}
            minLength={2}
            name="displayName"
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
          <span className="text-xs font-normal leading-5 text-slate-500">This is the name other PuruPuru users may see on future reviews and contributions.</span>
        </label>

        <fieldset>
          <legend className="text-sm font-bold text-slate-800">Avatar</legend>
          <p className="mt-1 text-xs text-slate-500">Choose a first-party PuruPuru avatar.</p>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {avatars.map((avatar) => {
              const selected = avatar.id === selectedAvatarId;
              return (
                <label className={`cursor-pointer rounded-2xl border p-2 text-center transition ${selected ? "border-brand-action bg-slate-50 ring-2 ring-brand-action" : "border-slate-200 hover:border-slate-400"}`} key={avatar.id}>
                  <input
                    checked={selected}
                    className="sr-only"
                    name="selectedAvatarId"
                    onChange={() => setSelectedAvatarId(avatar.id)}
                    type="radio"
                    value={avatar.id}
                  />
                  <Image alt="" className="mx-auto h-auto w-full rounded-full" height={80} src={avatar.assetPath} width={80} />
                  <span className="mt-2 block text-xs font-bold text-slate-700">{avatar.name}</span>
                  <span className="sr-only">{selected ? "Selected" : "Select"}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold text-slate-800">Skin profile</legend>
          <p className="mt-1 text-xs text-slate-500">Optional context for your future skincare contributions.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${skinType === null ? "border-brand-action bg-slate-100 text-brand-action" : "border-slate-300 text-slate-600"}`}>
              <input checked={skinType === null} className="sr-only" name="skinType" onChange={() => setSkinType(null)} type="radio" value="" />
              Not selected
            </label>
            {PROFILE_SKIN_TYPES.map((value) => (
              <label className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${skinType === value ? "border-brand-action bg-slate-100 text-brand-action" : "border-slate-300 text-slate-600"}`} key={value}>
                <input checked={skinType === value} className="sr-only" name="skinType" onChange={() => setSkinType(value)} type="radio" value={value} />
                {skinTypeLabels[value]}
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input checked={sensitiveSkin} className="h-4 w-4 rounded border-slate-300" name="sensitiveSkin" onChange={(event) => setSensitiveSkin(event.target.checked)} type="checkbox" />
            Sensitive skin
          </label>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p aria-live="polite" className={`text-sm ${state.status === "SUCCESS" ? "text-emerald-700" : "text-rose-700"}`} role={state.status === "ERROR" || state.status === "INVALID" ? "alert" : undefined}>
            {state.message}
          </p>
          <SaveButton pending={isPending} />
        </div>
      </form>
    </section>
  );
}
