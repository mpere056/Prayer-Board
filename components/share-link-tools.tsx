"use client";

import { useState } from "react";

type ShareLink = {
  label: string;
  description: string;
  href: string;
};

export function ShareLinkTools({ links }: { links: ShareLink[] }) {
  const [copiedHref, setCopiedHref] = useState<string | null>(null);

  async function copyLink(href: string) {
    try {
      await navigator.clipboard.writeText(href);
      setCopiedHref(href);
      window.setTimeout(() => setCopiedHref(null), 1800);
    } catch (error) {
      console.error("Unable to copy link", error);
      window.prompt("Copy this link:", href);
    }
  }

  return (
    <div className="share-link-list">
      {links.map((link) => (
        <div className="share-link-row" key={link.href}>
          <div>
            <strong>{link.label}</strong>
            <p className="muted">{link.description}</p>
            <a href={link.href}>{link.href}</a>
          </div>
          <button className="button button-secondary" type="button" onClick={() => copyLink(link.href)}>
            {copiedHref === link.href ? "Copied" : "Copy"}
          </button>
        </div>
      ))}
    </div>
  );
}
