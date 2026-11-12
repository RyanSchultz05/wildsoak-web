import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - WildSoak",
  description: "What WildSoak collects, why, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 text-stone-800">
      <h1 className="text-3xl font-bold text-stone-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated November 12, 2026</p>

      <p className="mt-8 leading-7">
        WildSoak helps you find hot springs and plan trips to them. This page says what the
        WildSoak app and website collect, what we do with it, and how you can remove it.
        You can browse springs, save them on your device and plan trips without an account.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">What we collect</h2>
      <ul className="mt-4 list-disc space-y-3 pl-6 leading-7">
        <li>
          <strong>Account details.</strong> If you create an account we store your email address
          and the display name and bio you choose. If you sign in with Apple or Google, we receive
          the email address that service shares with us.
        </li>
        <li>
          <strong>What you post.</strong> Reviews, ratings, visit dates and photos you submit are
          stored and, once approved, shown publicly with your display name.
        </li>
        <li>
          <strong>Your lists.</strong> Favorites and springs you mark as visited are stored with
          your account so they appear on your other devices.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">What stays on your device</h2>
      <ul className="mt-4 list-disc space-y-3 pl-6 leading-7">
        <li>
          <strong>Location.</strong> With your permission the app uses your location to sort
          nearby springs and to show driving times. Your location is sent to Apple Maps to
          calculate routes. We do not store it on our servers.
        </li>
        <li>
          <strong>Saved springs, trips, checklists, offline guides and settings.</strong> These
          are kept on your device and are not sent to us.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">What we do not do</h2>
      <p className="mt-4 leading-7">
        We do not sell your data, show ads, or track you across other apps and websites.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Who processes your data</h2>
      <ul className="mt-4 list-disc space-y-3 pl-6 leading-7">
        <li><strong>Supabase</strong> hosts our database, sign-in and photo storage.</li>
        <li><strong>Apple</strong> provides maps, routing and Sign in with Apple.</li>
        <li><strong>Google</strong> provides Sign in with Google if you choose it.</li>
        <li>
          If you open directions in Google Maps or Waze, the destination is handed to that app
          under its own privacy policy.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Deleting your data</h2>
      <p className="mt-4 leading-7">
        In the app, go to You, then Edit Profile, then Delete Account. This permanently removes
        your account, reviews, photos, favorites and visit history. You can also edit or delete
        any single review from its spring page. To remove data kept on your device, delete the app.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Children</h2>
      <p className="mt-4 leading-7">
        WildSoak is not directed to children under 13 and we do not knowingly collect their data.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Changes and contact</h2>
      <p className="mt-4 leading-7">
        If this policy changes we will update the date above. Questions or requests:{" "}
        <a className="underline" href="mailto:feedback@wildsoak.app">feedback@wildsoak.app</a>.
      </p>

      <p className="mt-10 text-sm text-stone-500">
        See also our <Link className="underline" href="/terms">Terms of Service</Link>.
      </p>
    </article>
  );
}
