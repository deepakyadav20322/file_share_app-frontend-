import { useEffect, useState } from "react";
import { DEFAULT_LIMITS, fetchLimits, formatDuration } from "./api";
import LegalLayout from "./LegalLayout";

export default function PrivacyPage() {
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  useEffect(() => {
    fetchLimits().then(setLimits);
  }, []);

  const sections = [
    {
      heading: "The short version",
      body: [
        { list: [
          "There are no accounts. You don't give us your name or email just to send a file.",
          "Files are kept only until the expiry you choose, then they are deleted automatically.",
          "We don't sell your data and we don't show ads.",
          "Files are not end-to-end encrypted. Don't send highly sensitive documents.",
        ] },
      ],
    },
    {
      heading: "What we collect",
      body: [
        { list: [
          "Your files: the content, file name, size and type, stored temporarily so the other person can download them.",
          "A transfer record: the 6-digit key, the expiry time and how many emails were sent for it.",
          "Email addresses you type when you use \"Send by email\". They are used only to send that one message through our email provider.",
          "Contact form details: your name, email, topic, message, the transfer key if you add one, and your IP address. They are saved in our database and sent to us by email so we can reply and handle your request.",
          "Technical data: your IP address is used briefly to limit abuse (for example repeated key guesses), and our hosting provider may keep standard server logs.",
        ] },
      ],
    },
    {
      heading: "How we use it",
      body: [
        { list: [
          "To let you send files and let others receive them.",
          "To send the emails you ask us to send.",
          "To answer your messages and to remove files when you ask.",
          "To keep the service secure and prevent abuse.",
        ] },
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        `Transferred files and their keys are deleted automatically when the expiry you picked is reached (${formatDuration(limits.expiryMinutes)} by default, at most ${formatDuration(limits.maxExpiryMinutes)}). Our cleanup runs every minute, so files are normally gone within a minute after expiry.`,
        "Contact messages are kept for up to 12 months, then deleted automatically. Copies in our email inbox are kept for as long as needed to handle your request.",
        "The older \"Classic\" link-sharing page keeps a file for about 24 hours and, if you use its email option, also keeps the sender and receiver addresses with that file until it is deleted.",
      ],
    },
    {
      heading: "Where your files are stored and how they are protected",
      body: [
        "Files are stored on our server's disk or with a cloud storage provider such as Amazon S3. Access requires the 6-digit key or the share link, and repeated wrong guesses are rate-limited.",
        "Anyone who has the key or link can download the files until they expire, so share it only with people you trust. Files are not end-to-end encrypted, and no online service can promise perfect security.",
      ],
    },
    {
      heading: "Who we share data with",
      body: [
        "We don't sell or rent your data. We use service providers who process data on our behalf, such as web hosting, cloud storage and email delivery, only to run SendAnyFile. We may disclose information if the law requires it or to protect the service and its users from abuse.",
      ],
    },
    {
      heading: "Your browser",
      body: [
        "To save you time, your browser remembers your last chosen expiry and the sender email you used. This is stored on your own device and is not sent to us. The Transfer pages do not use advertising or analytics trackers.",
      ],
    },
    {
      heading: "Your choices",
      body: [
        "You can ask us to delete a file sooner, or ask what we hold about you, through the Contact page. For file removal, include the 6-digit key. Files that have already expired are already deleted.",
      ],
    },
    {
      heading: "Children",
      body: ["SendAnyFile is not directed at children under 13 and we don't knowingly collect their personal information."],
    },
    {
      heading: "Changes to this policy",
      body: ["We may update this policy as the service changes. The date at the top shows the latest version. If we make a significant change we will say so on the site."],
    },
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      intro="This policy explains what SendAnyFile collects when you use it, why, and how long we keep it. We've kept it in plain language."
      sections={sections}
    />
  );
}
