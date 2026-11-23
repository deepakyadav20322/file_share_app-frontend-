import { useEffect, useState } from "react";
import { DEFAULT_LIMITS, fetchLimits, formatDuration, formatSize } from "./api";
import LegalLayout from "./LegalLayout";

export default function TermsPage() {
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  useEffect(() => {
    fetchLimits().then(setLimits);
  }, []);

  const sections = [
    {
      heading: "Agreeing to these terms",
      body: ["By using SendAnyFile you agree to these Terms and to our Privacy Policy. If you don't agree, please don't use the service."],
    },
    {
      heading: "What SendAnyFile is",
      body: [
        "SendAnyFile lets you send files to other people temporarily using a 6-digit key, QR code, link or email. It is a transfer tool, not a place to store files.",
        `Current limits: up to ${limits.maxFiles} files per transfer, ${formatSize(limits.maxFileSize)} per file and ${formatSize(limits.maxTotalSize)} in total. Files expire after the time you choose (${formatDuration(limits.expiryMinutes)} by default, up to ${formatDuration(limits.maxExpiryMinutes)}). We may change these limits at any time.`,
      ],
    },
    {
      heading: "Your files and your responsibility",
      body: [
        "You are responsible for the files you send. You confirm that you have the right to share them and that sharing them doesn't break any law or anyone else's rights.",
        "Anyone who has your key or link can download the files until they expire. Share the key only with people you trust, and avoid sending highly sensitive information because files are not end-to-end encrypted.",
      ],
    },
    {
      heading: "What you must not do",
      body: [
        { list: [
          "Upload or share anything illegal, including child sexual abuse material, or content that infringes copyright or other rights.",
          "Send malware, or files meant to harm, harass or defraud others.",
          "Try to guess other people's keys, scrape, overload or interfere with the service, or get around its limits.",
          "Use SendAnyFile to send spam or unwanted bulk email.",
        ] },
      ],
    },
    {
      heading: "Removal of content",
      body: [
        "We may remove files, block access or limit use of SendAnyFile at any time, especially if we believe these terms are being broken or to protect users and the service. To report abuse or ask for a file to be removed, use the Contact page and include the 6-digit key.",
      ],
    },
    {
      heading: "No guarantee that files are kept",
      body: [
        "Files are deleted when they expire and may be removed earlier for technical or safety reasons. Don't rely on SendAnyFile as a backup. Keep your own copy of anything important.",
      ],
    },
    {
      heading: "Service provided \"as is\"",
      body: [
        "SendAnyFile is provided as is and as available, without warranties of any kind, to the extent the law allows. We don't promise that the service will be uninterrupted, error-free or that files will always arrive.",
      ],
    },
    {
      heading: "Limit of liability",
      body: [
        "To the extent the law allows, SendAnyFile and its owners are not liable for indirect or consequential losses, loss of data or loss of profit arising from your use of the service. Nothing in these terms limits liability that cannot be limited by law.",
      ],
    },
    {
      heading: "Changes to the service and terms",
      body: ["We may change the service or these terms from time to time. The date at the top shows the latest version. Continuing to use SendAnyFile after a change means you accept the updated terms."],
    },
  ];

  return (
    <LegalLayout
      title="Terms of Use"
      intro="Please read these terms before sharing files with SendAnyFile. They are short and written to be understood."
      sections={sections}
    />
  );
}
