import { Resend } from "resend";
import { createElement } from "react";
import WelcomeEmail from "@/emails/welcome";
import InviteEmail from "@/emails/invite";
import ResetPasswordEmail from "@/emails/reset-password";
import VoteCodeEmail from "@/emails/vote-code";
import PaymentFailedEmail from "@/emails/payment-failed";
import WeeklyDigestEmail from "@/emails/weekly-digest";
import type { WeeklyDigestEmailProps } from "@/emails/weekly-digest";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Koinos <noreply@koinos.app>";

type EmailTemplate =
  | {
      template: "welcome";
      data: { memberName: string; churchName: string; appUrl: string };
    }
  | {
      template: "invite";
      data: {
        inviteeName: string;
        inviterName: string;
        churchName: string;
        inviteUrl: string;
      };
    }
  | {
      template: "reset-password";
      data: { memberName: string; resetUrl: string };
    }
  | {
      template: "vote-code";
      data: {
        memberName: string;
        assemblyName: string;
        electionName: string;
        code: string;
        expiresAt: string;
      };
    }
  | {
      template: "payment-failed";
      data: { churchName: string; managePlanUrl: string };
    }
  | {
      template: "weekly-digest";
      data: WeeklyDigestEmailProps;
    };

type SendEmailParams = {
  to: string;
  subject: string;
} & EmailTemplate;

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, template, data } = params;

  let reactElement: React.ReactElement;

  switch (template) {
    case "welcome":
      reactElement = createElement(WelcomeEmail, data);
      break;
    case "invite":
      reactElement = createElement(InviteEmail, data);
      break;
    case "reset-password":
      reactElement = createElement(ResetPasswordEmail, data);
      break;
    case "vote-code":
      reactElement = createElement(VoteCodeEmail, data);
      break;
    case "payment-failed":
      reactElement = createElement(PaymentFailedEmail, data);
      break;
    case "weekly-digest":
      reactElement = createElement(WeeklyDigestEmail, data);
      break;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    react: reactElement,
  });
}
