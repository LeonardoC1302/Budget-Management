"use client";

import Link from "next/link";
import RouteMasthead from "@/components/molecules/RouteMasthead";

interface SettingsLink {
  href: string;
  title: string;
  description: string;
}

const SECTIONS: { heading: string; links: SettingsLink[] }[] = [
  {
    heading: "Sharing",
    links: [
      {
        href: "/settings/connections",
        title: "Connections",
        description: "Manage the people you share your money with.",
      },
    ],
  },
  {
    heading: "Your data",
    links: [
      {
        href: "/settings/data",
        title: "Import & export",
        description: "Download your transactions as CSV, or bring them in from a spreadsheet.",
      },
      {
        href: "/settings/trash",
        title: "Recently deleted",
        description: "Restore anything deleted in the last 30 days.",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <RouteMasthead kicker="Perch" title="Settings" />

      {SECTIONS.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="label-sm">{section.heading}</h2>
          <ul className="rooms">
            {section.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm text-fg">{link.title}</span>
                    <span className="text-xs text-fg-subtle">
                      {link.description}
                    </span>
                  </div>
                  <span aria-hidden className="text-fg-subtle">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
