import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - WildSoak",
  description: "The terms for using the WildSoak app and website.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 text-stone-800">
      <h1 className="text-3xl font-bold text-stone-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated November 12, 2026</p>

      <p className="mt-8 leading-7">
        By using the WildSoak app or website you agree to these terms. If you do not agree,
        please do not use WildSoak.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Information about springs</h2>
      <p className="mt-4 leading-7">
        Spring locations and temperatures come from a public U.S. thermal springs survey.
        Descriptions are written to help you plan and many are marked Unconfirmed because they
        have not been checked by a visit. Access, ownership, closures, road conditions and water
        temperature change, and listings can be wrong or out of date. A listing is not permission
        to enter private or closed land.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Your safety is your responsibility</h2>
      <p className="mt-4 leading-7">
        Hot springs and the places around them can be dangerous. Water can scald, sources can
        carry harmful organisms, roads can be impassable and help can be far away. Driving and
        hiking times shown in WildSoak are estimates. Check current conditions and local rules
        before you travel, test water before entering, and use your own judgment. You use
        WildSoak and visit any spring at your own risk.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Your account and your posts</h2>
      <ul className="mt-4 list-disc space-y-3 pl-6 leading-7">
        <li>Keep your sign-in details private. You are responsible for activity on your account.</li>
        <li>
          You keep ownership of the reviews and photos you post. You give WildSoak permission to
          store and display them in the app and on the website.
        </li>
        <li>
          Post only your own honest experience and photos you have the right to share. Do not post
          anything unlawful, harassing, or that shows other people without their consent.
        </li>
        <li>
          Reviews are moderated. We may decline or remove posts and suspend accounts that break
          these terms.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Respect the places</h2>
      <p className="mt-4 leading-7">
        Follow posted rules, pack out what you bring, keep soap and glass away from the water,
        and respect other visitors and private property.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">No warranty and limits on liability</h2>
      <p className="mt-4 leading-7">
        WildSoak is provided as is, without warranties of any kind. To the fullest extent the law
        allows, WildSoak is not liable for injury, loss or damage arising from your use of the
        app or website or from a visit to any spring listed in it.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Changes and contact</h2>
      <p className="mt-4 leading-7">
        We may update these terms and will change the date above when we do. Questions:{" "}
        <a className="underline" href="mailto:feedback@wildsoak.app">feedback@wildsoak.app</a>.
      </p>

      <p className="mt-10 text-sm text-stone-500">
        See also our <Link className="underline" href="/privacy">Privacy Policy</Link>.
      </p>
    </article>
  );
}
